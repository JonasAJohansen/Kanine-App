import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { bookId: string; pageNumber: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const bookId = parseInt(params.bookId);
    const pageNumber = parseInt(params.pageNumber);

    const pageFile = await prisma.pageFile.findUnique({
      where: {
        bookId_pageNumber: {
          bookId,
          pageNumber,
        },
      },
    });

    if (!pageFile) {
      return new NextResponse("File not found", { status: 404 });
    }

    return new NextResponse(pageFile.fileContent, {
      headers: {
        'Content-Type': pageFile.fileType,
        'Content-Disposition': `inline; filename="${pageFile.fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error in file serve API:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}