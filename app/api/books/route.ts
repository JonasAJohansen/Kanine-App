import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const books = await prisma.book.findMany({
      where: { userId },
      include: { 
        notes: true,
        starredPages: true
      },
    });
    return NextResponse.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title, pages } = await request.json();
    const book = await prisma.book.create({
      data: {
        userId,
        title,
        pages,
      },
      include: {
        starredPages: true
      }
    });
    return NextResponse.json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}