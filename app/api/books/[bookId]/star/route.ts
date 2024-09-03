import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '/vercel/path0/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const { userId } = getAuth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const bookId = parseInt(params.bookId);
    const { pageNumber } = await req.json();

    const book = await prisma.book.findUnique({
      where: { id: bookId, userId },
      include: { starredPages: true },
    });

    if (!book) {
      return new NextResponse("Book not found", { status: 404 });
    }

    const existingStarredPage = book.starredPages.find(sp => sp.page === pageNumber);

    if (existingStarredPage) {
      await prisma.starredPage.delete({
        where: { id: existingStarredPage.id },
      });
    } else {
      await prisma.starredPage.create({
        data: {
          bookId,
          page: pageNumber,
        },
      });
    }

    const updatedBook = await prisma.book.findUnique({
      where: { id: bookId },
      include: { starredPages: true },
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error in star page API:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
