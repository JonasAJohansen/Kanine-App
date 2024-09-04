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
      },
      include: { books: true },
    });

    if (!category || category.userId !== userId) {
      return new NextResponse('Category not found', { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return new NextResponse('Category name is required', { status: 400 });
    }

    const updatedCategory = await prisma.category.updateMany({
      where: { 
        id: parseInt(params.categoryId),
        userId,
      },
      data: { name },
    });

    if (updatedCategory.count === 0) {
      return new NextResponse('Category not found or unauthorized', { status: 404 });
    }

    return NextResponse.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const deletedCategory = await prisma.category.deleteMany({
      where: { 
        id: parseInt(params.categoryId),
        userId,
      },
    });

    if (deletedCategory.count === 0) {
      return new NextResponse('Category not found or unauthorized', { status: 404 });
    }

    return new NextResponse('Category deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
