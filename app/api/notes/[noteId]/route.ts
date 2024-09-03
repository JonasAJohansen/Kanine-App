import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const noteId = parseInt(params.noteId);
    const { content, tags, bookId, pageNumber } = await request.json();

    // Check if the note belongs to the user
    const existingNote = await prisma.note.findUnique({
      where: { id: noteId },
      include: { tags: true },
    });

    if (!existingNote || existingNote.userId !== userId) {
      return new NextResponse('Note not found or unauthorized', { status: 404 });
    }

    // Update the note
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        content,
        bookId,
        pageNumber,
        tags: {
          disconnect: existingNote.tags.map(tag => ({ id: tag.id })),
          connectOrCreate: tags.map((tagName: string) => ({
            where: { name_userId: { name: tagName, userId } },
            create: { name: tagName, userId },
          })),
        },
      },
      include: { tags: true },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const noteId = parseInt(params.noteId);

    // Check if the note belongs to the user
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== userId) {
      return new NextResponse('Note not found or unauthorized', { status: 404 });
    }

    // Delete the note
    await prisma.note.delete({
      where: { id: noteId },
    });

    return new NextResponse('Note deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}