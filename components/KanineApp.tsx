'use client'

import React, { useState, useEffect, useRef } from 'react'
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight, Search, Tag, Clock, Star, Book, GraduationCap, Trash2, Moon, Sun, ChevronDown, ChevronUp, Upload } from 'lucide-react'

type StarredPage = {
  id: number;
  bookId: number;
  page: number;
}

type PageFile = {
  id: number;
  bookId: number;
  pageNumber: number;
  fileUrl: string | null;
  fileType: string;
  fileName: string;
}

type Book = {
  id: number;
  title: string;
  pages: number;
  starredPages: StarredPage[];
  pageFiles: PageFile[];
}

type Tag = {
  id: number;
  name: string;
  userId: string;
}

type Note = {
  id: number;
  content: string;
  tags: Tag[];
  createdAt: string;
  isFavorite: boolean;
  bookId: number;
  pageNumber: number;
}

export default function KanineApp() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [newBookTitle, setNewBookTitle] = useState('')
  const [newBookPages, setNewBookPages] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState('')
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [expandedBooks, setExpandedBooks] = useState<number[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBooks()
  }, [])

  useEffect(() => {
    if (selectedBook) {
      fetchNotes(selectedBook.id, currentPage)
      fetchBookDetails(selectedBook.id)
    }
  }, [selectedBook, currentPage])

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books')
      if (response.ok) {
        const data = await response.json()
        setBooks(data)
      } else {
        console.error('Failed to fetch books')
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    }
  }

  const fetchBookDetails = async (bookId: number) => {
    try {
      const response = await fetch(`/api/books/${bookId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedBook(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch book details:', errorData.error);
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      // You might want to show an error message to the user here
    }
  };

  const fetchNotes = async (bookId: number, pageNumber: number) => {
    try {
      const response = await fetch(`/api/notes?bookId=${bookId}&pageNumber=${pageNumber}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      } else {
        console.error('Failed to fetch notes')
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const addBook = async () => {
    if (newBookTitle && newBookPages) {
      try {
        const response = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newBookTitle, pages: parseInt(newBookPages) }),
        })
        if (response.ok) {
          const newBook = await response.json()
          setBooks([...books, newBook])
          setNewBookTitle('')
          setNewBookPages('')
          setIsAddBookDialogOpen(false)
        } else {
          console.error('Failed to add book')
        }
      } catch (error) {
        console.error('Error adding book:', error)
      }
    }
  }

  const deleteBook = async (bookId: number) => {
    try {
      const response = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
      if (response.ok) {
        setBooks(books.filter(book => book.id !== bookId))
        if (selectedBook?.id === bookId) {
          setSelectedBook(null)
        }
      } else {
        console.error('Failed to delete book')
      }
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  const selectBook = (book: Book) => {
    setSelectedBook(book)
    setCurrentPage(1)
  }

  const addNote = async () => {
    if (currentNote && selectedBook) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: selectedBook.id,
            content: currentNote,
            pageNumber: currentPage,
            tags: currentTags,
          }),
        })
        if (response.ok) {
          const newNote = await response.json()
          setNotes([newNote, ...notes])
          setCurrentNote('')
          setCurrentTags([])
        } else {
          console.error('Failed to add note')
        }
      } catch (error) {
        console.error('Error adding note:', error)
      }
    }
  }

  const editNote = (note: Note) => {
    setEditingNote(note)
    setCurrentNote(note.content)
    setCurrentTags(note.tags.map(tag => tag.name))
  }

  const saveEditedNote = async () => {
    if (editingNote && selectedBook) {
      try {
        const response = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: currentNote,
            tags: currentTags,
          }),
        })
        if (response.ok) {
          const updatedNote = await response.json()
          setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note))
          setEditingNote(null)
          setCurrentNote('')
          setCurrentTags([])
        } else {
          console.error('Failed to update note')
        }
      } catch (error) {
        console.error('Error updating note:', error)
      }
    }
  }

  const deleteNote = async (noteId: number) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId))
        setNoteToDelete(null)
      } else {
        console.error('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const addTag = () => {
    if (newTag && !currentTags.includes(newTag)) {
      setCurrentTags([...currentTags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove))
  }

  const toggleFavorite = async (noteId: number) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/favorite`, { method: 'POST' })
      if (response.ok) {
        const updatedNote = await response.json()
        setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note))
      } else {
        console.error('Failed to toggle favorite')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  const isPageStarred = (book: Book, pageNumber: number) => {
    return book.starredPages.some(starredPage => starredPage.page === pageNumber);
  };

  const toggleStarPage = async (bookId: number, pageNumber: number) => {
    try {
      const response = await fetch(`/api/books/${bookId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber }),
      });
      if (response.ok) {
        const updatedBook = await response.json();
        setBooks(books.map(book => book.id === updatedBook.id ? updatedBook : book));
        if (selectedBook?.id === updatedBook.id) {
          setSelectedBook(updatedBook);
        }
      } else {
        console.error('Failed to toggle star page');
      }
    } catch (error) {
      console.error('Error toggling star page:', error);
    }
  };

  const toggleExpandBook = (bookId: number) => {
    setExpandedBooks(prevExpanded => 
      prevExpanded.includes(bookId)
        ? prevExpanded.filter(id => id !== bookId)
        : [...prevExpanded, bookId]
    )
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedBook) {
      uploadFile(selectedBook.id, currentPage, file);
    }
  };

  const uploadFile = async (bookId: number, pageNumber: number, file: File) => {
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pageNumber', pageNumber.toString());

    try {
      const response = await fetch(`/api/books/${bookId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const updatedBook = await response.json();
        setBooks(books.map(book => book.id === updatedBook.id ? updatedBook : book));
        if (selectedBook?.id === updatedBook.id) {
          setSelectedBook(updatedBook);
        }
      } else {
        console.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ).filter(note => {
    if (activeTab === 'all') return true;
    if (activeTab === 'favorites') return note.isFavorite;
    return note.tags.some(tag => tag.name === activeTab);
  });

  const uniqueTags = Array.from(new Set(filteredNotes.flatMap(note => note.tags.map(tag => tag.name))));

  return (
    <div className={`min-h-screen bg-background text-foreground p-4 flex flex-col ${isDarkTheme ? 'dark' : ''}`}>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Kanine</h1>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isAddBookDialogOpen} onOpenChange={setIsAddBookDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Book</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Input 
                  value={newBookTitle} 
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Book title"
                />
                <Input 
                  value={newBookPages} 
                  onChange={(e) => setNewBookPages(e.target.value)}
                  placeholder="Number of pages"
                  type="number"
                />
                <Button onClick={addBook}>Add Book</Button>
              </div>
            </DialogContent>
          </Dialog>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>
      <div className="flex-grow flex gap-4">
        <aside className="w-48 bg-card rounded-lg p-4 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Books</h2>
          <ScrollArea className="flex-grow">
            {books.map((book) => (
              <div key={book.id} className="mb-2">
                <div 
                  className={`flex items-center justify-between cursor-pointer p-2 rounded hover:bg-accent ${selectedBook?.id === book.id ? 'bg-accent' : ''}`}
                >
                  <div className="flex items-center gap-2 flex-grow" onClick={() => selectBook(book)}>
                    <Book className="w-4 h-4" />
                    <span className="text-sm truncate">{book.title}</span>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleExpandBook(book.id)}>
                      {expandedBooks.includes(book.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the book and all its notes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteBook(book.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {expandedBooks.includes(book.id) && book.starredPages.length > 0 && (
                  <div className="ml-4 mt-1">
                    {book.starredPages.map(starredPage => (
                      <div 
                        key={starredPage.id} 
                        className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-accent text-xs"
                        onClick={() => {
                          selectBook(book)
                          setCurrentPage(starredPage.page)
                        }}
                      >
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span>Page {starredPage.page}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
          <Button onClick={toggleTheme} variant="outline" size="sm" className="mt-auto">
            {isDarkTheme ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {isDarkTheme ? 'Light' : 'Dark'}
          </Button>
        </aside>

        <main className="flex-grow flex gap-4">
          {selectedBook ? (
            <>
              <div className="w-1/3 bg-card rounded-lg p-4 flex flex-col">
                <h2 className="text-xl font-semibold mb-3">Notes</h2>
                <div className="space-y-3 mb-3">
                  <Textarea 
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="Take your notes here..."
                    className="min-h-[100px] resize-none"
                  />
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-grow"
                    />
                    <Button onClick={addTag} size="sm">Add</Button>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {currentTags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-primary-foreground hover:text-accent-foreground">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Button onClick={editingNote ? saveEditedNote : addNote} className="w-full">
                    {editingNote ? 'Save Changes' : 'Add Note'}
                  </Button>
                </div>
                <div className="mb-3">
                  <Input 
                    placeholder="Search notes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start mb-3 flex-wrap">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="favorites">Favorites</TabsTrigger>
                    {uniqueTags.map(tag => (
                      <TabsTrigger key={tag} value={tag}>{tag}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <ScrollArea className="flex-grow">
                  {filteredNotes.map((note) => (
                    <div key={note.id} className="p-3 mb-3 bg-background rounded-lg shadow-sm">
                      <p className="mb-2 text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex gap-1 mb-2 flex-wrap">
                        {note.tags.map((tag) => (
                          <span key={tag.id} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span><Clock className="w-3 h-3 inline mr-1" />{new Date(note.createdAt).toLocaleString()}</span>
                        <div>
                          <Button onClick={() => editNote(note)} size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Tag className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the note.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteNote(note.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button onClick={() => toggleFavorite(note.id)} size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Star className={`w-4 h-4 ${note.isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div className="flex-1 bg-card rounded-lg p-4 flex flex-col">
                <h2 className="text-xl font-semibold mb-3">Reader</h2>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      size="sm"
                      variant="outline"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">Page {currentPage} of {selectedBook.pages}</span>
                    <Button 
                      onClick={() => setCurrentPage(Math.min(selectedBook.pages, currentPage + 1))}
                      disabled={currentPage === selectedBook.pages}
                      size="sm"
                      variant="outline"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => toggleStarPage(selectedBook.id, currentPage)}
                      size="sm"
                      variant="outline"
                    >
                      <Star className={`w-4 h-4 ${isPageStarred(selectedBook, currentPage) ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                    </Button>
                    <Button
                      onClick={handleUploadClick}
                      size="sm"
                      variant="outline"
                      disabled={uploadingFile}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFile ? 'Uploading...' : 'Upload'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      disabled={uploadingFile}
                    />
                  </div>
                </div>
                <div className="bg-muted flex-grow rounded-lg flex items-center justify-center">
                  {selectedBook.pageFiles && selectedBook.pageFiles.length > 0 ? (
                    (() => {
                      const pageFile = selectedBook.pageFiles.find(pf => pf.pageNumber === currentPage);
                      if (pageFile) {
                        if (pageFile.fileType.startsWith('image/')) {
                          return (
                            <img 
                              src={pageFile.fileUrl || ''}
                              alt={`Page ${currentPage}`}
                              className="max-w-full max-h-full object-contain"
                            />
                          );
                        } else if (pageFile.fileType === 'application/pdf') {
                          return (
                            <iframe
                              src={pageFile.fileUrl || ''}
                              className="w-full h-full"
                              title={`Page ${currentPage}`}
                            />
                          );
                        } else {
                          return <p>Unsupported file type</p>;
                        }
                      } else {
                        return <p>No file uploaded for this page</p>;
                      }
                    })()
                  ) : (
                    <p>No files uploaded for this book</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p>Select a book to start taking notes</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}