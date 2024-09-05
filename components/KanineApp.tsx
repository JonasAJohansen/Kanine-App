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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search, Tag, Clock, Star, Book, GraduationCap, Trash2, Moon, Sun, ChevronDown, ChevronUp, Upload, Edit, Loader2, FolderPlus } from 'lucide-react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Card } from "@/components/ui/card"

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

type Category = {
  id: number;
  name: string;
}

type Book = {
  id: number;
  title: string;
  pages: number;
  starredPages: StarredPage[];
  pageFiles: PageFile[];
  notesCount: number;
  categoryId: number | null;
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

const ALL_CATEGORIES = 'all';

export default function KanineApp() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('')
  const [newBookTitle, setNewBookTitle] = useState('')
  const [newBookPages, setNewBookPages] = useState('')
  const [newBookCategory, setNewBookCategory] = useState<string>(ALL_CATEGORIES)
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState('')
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false)
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [expandedBooks, setExpandedBooks] = useState<number[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null)
  const [globalSearchResults, setGlobalSearchResults] = useState<Note[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAllBooks, setShowAllBooks] = useState(false)

  useEffect(() => {
    fetchBooks()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedBookId) {
      const book = books.find(b => b.id === selectedBookId)
      if (book) {
        setSelectedBook(book)
        setCurrentPage(1)
        setPageInput('1')
        fetchNotes(book.id, 1)
        if (!book.pageFiles || book.pageFiles.length === 0) {
          fetchBookDetails(book.id)
        }
        setShowAllBooks(false)
      }
    }
  }, [selectedBookId, books])

  useEffect(() => {
    if (selectedBook) {
      fetchNotes(selectedBook.id, currentPage)
    }
  }, [selectedBook, currentPage])

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books?includeCategory=true')
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBookDetails = async (bookId: number) => {
    try {
      const response = await fetch(`/api/books/${bookId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          pageFiles: data.pageFiles || [],
          notesCount: data.notesCount || 0
        };
      } else {
        console.error('Failed to fetch book details:', await response.json());
        return null;
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      return null;
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
          body: JSON.stringify({ 
            title: newBookTitle, 
            pages: parseInt(newBookPages),
            categoryId: newBookCategory === ALL_CATEGORIES ? null : parseInt(newBookCategory)
          }),
        })
        if (response.ok) {
          const newBook = await response.json()
          setBooks([...books, newBook])
          setNewBookTitle('')
          setNewBookPages('')
          setNewBookCategory(ALL_CATEGORIES)
          setIsAddBookDialogOpen(false)
        } else {
          console.error('Failed to add book')
        }
      } catch (error) {
        console.error('Error adding book:', error)
      }
    }
  }

  const addCategory = async () => {
    if (newCategoryName) {
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName }),
        })
        if (response.ok) {
          const newCategory = await response.json()
          setCategories([...categories, newCategory])
          setNewCategoryName('')
          setIsAddCategoryDialogOpen(false)
        } else {
          console.error('Failed to add category')
        }
      } catch (error) {
        console.error('Error adding category:', error)
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
    setSelectedBookId(book.id)
    setShowAllBooks(false)
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

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageChange();
    }
  };

  const handlePageChange = () => {
    if (selectedBook) {
      const newPage = parseInt(pageInput);
      if (!isNaN(newPage) && newPage >= 1 && newPage <= selectedBook.pages) {
        setCurrentPage(newPage);
      } else {
        setPageInput(currentPage.toString());
      }
    }
  };

  const performGlobalSearch = async () => {
    if (selectedBook && searchTerm) {
      setIsSearching(true)
      try {
        const allNotes: Note[] = [];
        for (let page = 1; page <= selectedBook.pages; page++) {
          const response = await fetch(`/api/notes?bookId=${selectedBook.id}&pageNumber=${page}`);
          if (response.ok) {
            const pageNotes: Note[] = await response.json();
            allNotes.push(...pageNotes);
          }
        }
        const results = allNotes.filter(note =>
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setGlobalSearchResults(results);
      } catch (error) {
        console.error('Error performing global search:', error);
      } finally {
        setIsSearching(false)
      }
    } else {
      setGlobalSearchResults([]);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const debounceTimer = setTimeout(() => {
        performGlobalSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setGlobalSearchResults([]);
    }
  }, [searchTerm, selectedBook]);

  const navigateToNote = (note: Note) => {
    setCurrentPage(note.pageNumber);
    setPageInput(note.pageNumber.toString());
    fetchNotes(selectedBook!.id, note.pageNumber);
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

  const AllBooksView = () => {
    const [detailedBooks, setDetailedBooks] = useState<Book[]>([]);

    useEffect(() => {
      const fetchAllBookDetails = async () => {
        const bookDetailsPromises = books.map(book => fetchBookDetails(book.id));
        const bookDetails = await Promise.all(bookDetailsPromises);
        setDetailedBooks(bookDetails.filter(book => book !== null) as Book[]);
      };

      fetchAllBookDetails();
    }, [books]);

    const filteredBooks = selectedCategory === ALL_CATEGORIES
      ? detailedBooks
      : detailedBooks.filter(book => book.categoryId === parseInt(selectedCategory));

    return (
      <div className="bg-card rounded-lg p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">All Books</h2>
          <Button variant="outline" onClick={() => setShowAllBooks(false)}>
            Back
          </Button>
        </div>
        <div className="mb-4">
          <Select 
            value={selectedCategory} 
            onValueChange={(value) => setSelectedCategory(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="p-4">
              <h3 className="text-lg font-semibold mb-2">{book.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">Pages: {book.pages}</p>
              <p className="text-sm text-muted-foreground mb-2">
                Notes: {book.notesCount}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Starred Pages: {book.starredPages.length}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Category: {categories.find(c => c.id === book.categoryId)?.name || 'Uncategorized'}
              </p>
              <Button onClick={() => {
                selectBook(book)
                setShowAllBooks(false)
              }}>
                Open Book
              </Button>
            </Card>
          ))}
        </div>
      </div>
    )
  }

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
                <Select value={newBookCategory} onValueChange={setNewBookCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CATEGORIES}>Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addBook}>Add Book</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Input 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                />
                <Button onClick={addCategory}>Add Category</Button>
              </div>
            </DialogContent>
          </Dialog>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>
      <div className="flex-grow flex gap-4">
        <aside className="w-64 bg-card rounded-lg p-4 flex flex-col relative shadow-md">
          <h2 
            className="text-lg font-semibold mb-4 cursor-pointer hover:text-primary transition-colors flex items-center justify-between"
            onClick={() => setShowAllBooks(true)}
          >
            <span>Books</span>
            <ChevronRight className="w-4 h-4" />
          </h2>
          <ScrollArea className="flex-grow">
            <div className="mb-4">
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {books
              .filter(book => selectedCategory === ALL_CATEGORIES || book.categoryId === parseInt(selectedCategory))
              .map((book) => (
              <div key={book.id} className="mb-2">
                <div 
                  className={`grid grid-cols-[1fr,auto,auto] items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent transition-colors duration-200 ${selectedBook?.id === book.id ? 'bg-accent' : ''}`}
                  onClick={() => selectBook(book)}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Book className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">{book.title}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{book.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpandBook(book.id);
                    }}
                  >
                    {expandedBooks.includes(book.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                {expandedBooks.includes(book.id) && book.starredPages.length > 0 && (
                  <div className="ml-4 mt-1">
                    {book.starredPages.map(starredPage => (
                      <div 
                        key={starredPage.id} 
                        className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-accent text-xs"
                        onClick={() => {
                          selectBook(book)
                          setCurrentPage(starredPage.page)
                          setPageInput(starredPage.page.toString())
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
        </aside>

        {showAllBooks ? (
          <AllBooksView />
        ) : selectedBook ? (
          <ResizablePanelGroup direction="horizontal" className="flex-grow">
            <ResizablePanel defaultSize={33} minSize={20}>
              <div className="bg-card rounded-lg p-4 flex flex-col h-full">
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
                <div className="mb-3 relative">
                  <Input 
                    placeholder="Search notes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(globalSearchResults.length > 0 ? globalSearchResults : filteredNotes).map((note) => (
                      <div key={note.id} className="p-3 rounded-lg shadow-sm bg-card flex flex-col">
                        <p className="mb-2 text-sm whitespace-pre-wrap flex-grow">{note.content}</p>
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {note.tags.map((tag) => (
                            <span key={tag.id} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                          <span><Clock className="w-3 h-3 inline mr-1" />{new Date(note.createdAt).toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            <Button onClick={() => editNote(note)} size="sm" variant="outline" className="h-6 px-2 py-1">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
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
                            {globalSearchResults.length > 0 && (
                              <Button onClick={() => navigateToNote(note)} size="sm" variant="outline" className="h-6 px-2 py-1">
                                Go to Page {note.pageNumber}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={67} minSize={30}>
              <div className="bg-card rounded-lg p-4 flex flex-col h-full">
                <h2 className="text-xl font-semibold mb-3">Reader</h2>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setCurrentPage(newPage);
                        setPageInput(newPage.toString());
                      }}
                      disabled={currentPage === 1}
                      size="sm"
                      variant="outline"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center">
                      <Input
                        type="text"
                        value={pageInput}
                        onChange={handlePageInputChange}
                        onKeyDown={handlePageInputKeyDown}
                        onBlur={handlePageChange}
                        className="w-16 text-center"
                      />
                      <span className="ml-2">of {selectedBook.pages}</span>
                    </div>
                    <Button 
                      onClick={() => {
                        const newPage = Math.min(selectedBook.pages, currentPage + 1);
                        setCurrentPage(newPage);
                        setPageInput(newPage.toString());
                      }}
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
                <div className="bg-muted flex-grow rounded-lg flex items-center justify-center overflow-hidden">
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
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex-grow flex items-center justify-center bg-card rounded-lg">
            <p className="text-xl text-muted-foreground">Select a book to start taking notes</p>
          </div>
        )}
      </div>
      <Button 
        onClick={toggleTheme} 
        variant="outline" 
        size="sm" 
        className="fixed bottom-4 left-4 z-50"
      >
        {isDarkTheme ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
        {isDarkTheme ? 'Light' : 'Dark'}
      </Button>
    </div>
  )
}
