import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const bookId = parseInt(params.bookId)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const pageNumber = parseInt(formData.get('pageNumber') as string)

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    })

    const fileContent = Buffer.from(await file.arrayBuffer())

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { pageFiles: true },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const existingPageFile = book.pageFiles.find(pf => pf.pageNumber === pageNumber)

    if (existingPageFile) {
      await prisma.pageFile.update({
        where: { id: existingPageFile.id },
        data: {
          fileUrl: blob.url,
          fileType: file.type,
          fileName: file.name,
          fileContent: fileContent
        },
      })
    } else {
      await prisma.pageFile.create({
        data: {
          bookId,
          pageNumber,
          fileUrl: blob.url,
          fileType: file.type,
          fileName: file.name,
          fileContent: fileContent
        },
      })
    }

    const updatedBook = await prisma.book.findUnique({
      where: { id: bookId },
      include: { pageFiles: true, starredPages: true },
    })

    return NextResponse.json(updatedBook)
  } catch (error) {
    console.error('Error in file upload API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}