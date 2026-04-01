export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Tag {
  id: string;
  name: string;
}

export interface TagCategory {
  id: string;
  name: string;
  tags: string[];
}

export interface FolderWithPrompts extends Folder {
  prompts: Prompt[];
  children: FolderWithPrompts[];
}

export interface FolderTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderTreeNode[];
  promptCount: number;
}
