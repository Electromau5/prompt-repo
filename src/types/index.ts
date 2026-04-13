export interface Folder {
  id: string
  name: string
  parentId: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface Prompt {
  id: string
  title: string
  content: string
  folderId: string
  tags: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Tag {
  id: string
  name: string
}

export interface TagCategory {
  id: string
  name: string
  tags: string[]
}

export interface Notebook {
  id: string
  name: string
  type: 'prompts' | 'notebook' | 'book'
  createdAt?: Date
  updatedAt?: Date
}

export interface Note {
  id: string
  notebookId: string
  title: string
  content: string
  type: 'text' | 'spreadsheet' | 'prompt'
  template?: string | null
  tags?: string[]
  position?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface AppData {
  folders: Folder[]
  prompts: Prompt[]
  tags: string[]
  tagCategories: TagCategory[]
  notebooks: Notebook[]
  notes: Note[]
}
