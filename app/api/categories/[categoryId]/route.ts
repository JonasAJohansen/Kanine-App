import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const category = await prisma.category.findUnique({
      where: { 
        id: parseInt(params.categoryId),
        userId: userId
      },
      include: {
        books: true
      }
    });

    if (!category) {
      return new NextResponse('Category not found', { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Add PUT and DELETE methods here if needed
