import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const bookId = parseInt(params.bookId);
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const pageNumber = parseInt(formData.get('pageNumber') as string);

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId, userId },
    });

    if (!book) {
      return new NextResponse("Book not found", { status: 404 });
    }

    const fileContent = await file.arrayBuffer();

    const pageFile = await prisma.pageFile.upsert({
      where: {
        bookId_pageNumber: {
          bookId,
          pageNumber,
        },
      },
      update: {
        fileName: file.name,
        fileType: file.type,
        fileContent: Buffer.from(fileContent),
      },
      create: {
        bookId,
        pageNumber,
        fileName: file.name,
        fileType: file.type,
        fileContent: Buffer.from(fileContent),
      },
    });

    return NextResponse.json({
      id: pageFile.id,
      bookId: pageFile.bookId,
      pageNumber: pageFile.pageNumber,
      fileName: pageFile.fileName,
      fileType: pageFile.fileType,
    });
  } catch (error) {
    console.error('Error in file upload API:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}