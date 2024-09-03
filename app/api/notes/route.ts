import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const pageNumber = searchParams.get('pageNumber');

    if (!bookId || !pageNumber) {
      return new NextResponse('Missing bookId or pageNumber', { status: 400 });
    }

    const notes = await prisma.note.findMany({
      where: {
        userId,
        bookId: parseInt(bookId),
        pageNumber: parseInt(pageNumber),
      },
      include: { tags: true },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { bookId, content, pageNumber, tags } = await request.json();
    
    const note = await prisma.note.create({
      data: {
        userId,
        bookId: parseInt(bookId),
        content,
        pageNumber: parseInt(pageNumber),
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name_userId: { name: tag, userId } },
            create: { name: tag, userId },
          })),
        },
      },
      include: { tags: true },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}