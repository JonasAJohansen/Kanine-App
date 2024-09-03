import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      where: { id: bookId },
    });

    if (!book || book.userId !== userId) {
      return new NextResponse('Book not found or unauthorized', { status: 404 });
    }

    // Delete associated notes and starred pages
    await prisma.note.deleteMany({
      where: { bookId },
    });

    await prisma.starredPage.deleteMany({
      where: { bookId },
    });

    // Delete the book
    await prisma.book.delete({
      where: { id: bookId },
    });

    return new NextResponse('Book deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting book:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}