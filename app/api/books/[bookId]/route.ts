import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const bookId = parseInt(params.bookId);

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId, userId },
      include: {
        starredPages: true,
        pageFiles: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const bookId = parseInt(params.bookId);

    // Check if the book belongs to the user
    const book = await prisma.book.findUnique({
      where: { id: bookId, userId },
    });

    if (!book) {
      return new NextResponse('Book not found or unauthorized', { status: 404 });
    }

    // Use a transaction to ensure all related records are deleted
    await prisma.$transaction(async (tx) => {
      // Delete associated notes and their tags
      const notes = await tx.note.findMany({
        where: { bookId },
        include: { tags: true },
      });

      for (const note of notes) {
        await tx.note.update({
          where: { id: note.id },
          data: { tags: { disconnect: note.tags } },
        });
      }

      await tx.note.deleteMany({
        where: { bookId },
      });

      // Delete associated starred pages
      await tx.starredPage.deleteMany({
        where: { bookId },
      });

      // Delete associated page files
      await tx.pageFile.deleteMany({
        where: { bookId },
      });

      // Delete the book
      await tx.book.delete({
        where: { id: bookId },
      });
    });

    return new NextResponse('Book deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting book:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}