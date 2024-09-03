import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string; pageNumber: string } }
) {
  try {
    const bookId = parseInt(params.bookId)
    const pageNumber = parseInt(params.pageNumber)

    const pageFile = await prisma.pageFile.findUnique({
      where: {
        bookId_pageNumber: {
          bookId: bookId,
          pageNumber: pageNumber,
        },
      },
    })

    if (!pageFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // If you're storing the file content in the database
    if (pageFile.fileContent) {
      return new NextResponse(pageFile.fileContent, {
        headers: {
          'Content-Type': pageFile.fileType,
          'Content-Disposition': `inline; filename="${pageFile.fileName}"`,
        },
      })
    }

    // If you're storing the file URL in the database
    if (pageFile.fileUrl) {
      return NextResponse.redirect(pageFile.fileUrl)
    }

    return NextResponse.json({ error: 'File content not available' }, { status: 404 })
  } catch (error) {
    console.error('Error in file serve API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}