import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { bookId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const bookId = parseInt(params.bookId);
    const { pageNumber } = await request.json();
    
    const existingStarredPage = await prisma.starredPage.findUnique({
      where: {
        bookId_page: {
          bookId,
          page: pageNumber
        }
      }
    });

    if (existingStarredPage) {
      // If the page is already starred, remove it
      await prisma.starredPage.delete({
        where: { id: existingStarredPage.id }
      });
    } else {
      // If the page is not starred, add it
      await prisma.starredPage.create({
        data: {
          bookId,
          page: pageNumber
        }
      });
    }

    const updatedBook = await prisma.book.findUnique({
      where: { id: bookId },
      include: { starredPages: true }
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error toggling star page:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}