import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '/vercel/path0/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const noteId = parseInt(params.noteId);

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { book: true },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    if (note.book.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { isFavorite: !note.isFavorite },
      include: { tags: true },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error in favorite note API:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
