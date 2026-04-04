'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, FolderPlus, Copy, Check, ChevronRight, ChevronDown, Edit2, Trash2, X, Tag, Download, Upload, Folder, FileText, Save, Move, LayoutGrid, List, ChevronsDownUp, ChevronsUpDown, GitMerge, ArrowUpDown, Menu, PanelLeftClose, BookOpen, Notebook, ChevronLeft, Table, Minus, MessageSquare, Calendar, Clock, Type, MoreVertical, GripVertical, Heart, DollarSign, Target } from 'lucide-react';
import * as XLSX from 'xlsx';
import { defaultData as initialDefaultData } from '../data/defaultFolders';

const generateId = () => Math.random().toString(36).substr(2, 9);

const emptyData = {
  folders: [],
  prompts: [],
  tags: [],
  tagCategories: []
};

// API helper functions
const api = {
  async getData() {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
  },
  async createFolder(name, parentId) {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId })
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
  },
  async updateFolder(id, name, parentId) {
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId })
    });
    if (!res.ok) throw new Error('Failed to update folder');
    return res.json();
  },
  async deleteFolder(id) {
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete folder');
  },
  async createPrompt(title, content, folderId, tags) {
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, folderId, tags })
    });
    if (!res.ok) throw new Error('Failed to create prompt');
    return res.json();
  },
  async updatePrompt(id, title, content, folderId, tags) {
    const res = await fetch(`/api/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, folderId, tags })
    });
    if (!res.ok) throw new Error('Failed to update prompt');
    return res.json();
  },
  async deletePrompt(id) {
    const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete prompt');
  },
  async createTagCategory(name, tags) {
    const res = await fetch('/api/tag-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tags })
    });
    if (!res.ok) throw new Error('Failed to create tag category');
    return res.json();
  },
  async updateTagCategory(id, name, tags) {
    const res = await fetch(`/api/tag-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tags })
    });
    if (!res.ok) throw new Error('Failed to update tag category');
    return res.json();
  },
  async deleteTagCategory(id) {
    const res = await fetch(`/api/tag-categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete tag category');
  },
  // Notebook APIs
  async createNotebook(name, type = 'notebook') {
    const res = await fetch('/api/notebooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    });
    if (!res.ok) throw new Error('Failed to create notebook');
    return res.json();
  },
  async updateNotebook(id, name) {
    const res = await fetch(`/api/notebooks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to update notebook');
    return res.json();
  },
  async deleteNotebook(id) {
    const res = await fetch(`/api/notebooks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete notebook');
  },
  // Note APIs
  async createNote(notebookId, title, content, type = 'text', template = null, tags = []) {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebookId, title, content, type, template, tags })
    });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
  },
  async updateNote(id, title, content, tags) {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tags })
    });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
  },
  async deleteNote(id) {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete note');
  },
  async moveNote(id, notebookId) {
    const res = await fetch(`/api/notes/${id}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebookId })
    });
    if (!res.ok) throw new Error('Failed to move note');
    return res.json();
  },
  async duplicateNote(id, notebookId = null) {
    const res = await fetch(`/api/notes/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebookId })
    });
    if (!res.ok) throw new Error('Failed to duplicate note');
    return res.json();
  },
  async convertPromptToNote(promptId, notebookId) {
    const res = await fetch(`/api/prompts/${promptId}/convert-to-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebookId })
    });
    if (!res.ok) throw new Error('Failed to convert prompt to note');
    return res.json();
  },
  async reorderNotes(notebookId, noteIds) {
    const res = await fetch('/api/notes/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebookId, noteIds })
    });
    if (!res.ok) throw new Error('Failed to reorder notes');
    return res.json();
  }
};

export default function PromptRepository() {
  const [data, setData] = useState(emptyData);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [expandedPrompts, setExpandedPrompts] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState(null);
  const [newPromptFolder, setNewPromptFolder] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [moveNotification, setMoveNotification] = useState(null);
  const [movingPrompt, setMovingPrompt] = useState(null);
  const [showTagCategoryManager, setShowTagCategoryManager] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportData, setBulkImportData] = useState({ prompts: [], folderId: null, tags: [], isFullBackup: false, folders: [] });
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [backupPreview, setBackupPreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [renameFolder, setRenameFolder] = useState(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [createdFolderIdForPrompt, setCreatedFolderIdForPrompt] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [gridEditMode, setGridEditMode] = useState(false);
  const [folderSort, setFolderSort] = useState('name'); // 'name', 'prompts', 'subfolders'
  const [selectedPrompts, setSelectedPrompts] = useState(new Set());
  const [showBulkMove, setShowBulkMove] = useState(false);
  const [bulkMoveSearch, setBulkMoveSearch] = useState('');
  const [bulkMoveNewFolder, setBulkMoveNewFolder] = useState({ show: false, parentId: null, name: '' });
  const [showMergeDuplicates, setShowMergeDuplicates] = useState(false);
  const [duplicateFolders, setDuplicateFolders] = useState([]);
  const [expandedDuplicateGroups, setExpandedDuplicateGroups] = useState(new Set());
  const [mergeScopeParentId, setMergeScopeParentId] = useState(null); // null = global, folderId = scoped to that folder's children
  const [showDuplicatePrompts, setShowDuplicatePrompts] = useState(false);
  const [duplicatePromptGroups, setDuplicatePromptGroups] = useState([]);
  const [duplicatePromptsFolderId, setDuplicatePromptsFolderId] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Drawer and Notebook state
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');

  // Notes state (for generic notebooks)
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', type: 'text', tags: [] });
  const [copiedNoteId, setCopiedNoteId] = useState(null);
  const [showMoveNote, setShowMoveNote] = useState(false);
  const [movingNoteId, setMovingNoteId] = useState(null);
  const [draggingNote, setDraggingNote] = useState(null);
  const [dragOverNotebook, setDragOverNotebook] = useState(null);
  const [dragOverNoteIndex, setDragOverNoteIndex] = useState(null);
  const [notesPanelOpen, setNotesPanelOpen] = useState(true);

  // Note template types
  const noteTemplates = [
    { id: 'text', name: 'Text Note', icon: 'FileText', description: 'Simple text note for writing' },
    { id: 'spreadsheet', name: 'Spreadsheet', icon: 'Table', description: 'Table with rows and columns' },
    { id: 'prompt', name: 'Prompt', icon: 'MessageSquare', description: 'AI prompt with instructions' }
  ];

  // Spreadsheet template categories and templates
  const spreadsheetCategories = [
    {
      id: 'health',
      name: 'Health',
      icon: 'Heart',
      templates: [
        {
          id: 'workout-tracker',
          name: 'Workout Tracker',
          description: 'Track your exercises, sets, reps, and progress',
          data: {
            tables: [{
              name: 'Workouts',
              columns: ['Date', 'Exercise', 'Sets', 'Reps', 'Weight (lbs)', 'Notes'],
              columnWidths: [120, 150, 80, 80, 100, 200],
              columnTypes: [
                { type: 'date' },
                { type: 'dropdown', options: ['Push-ups', 'Pull-ups', 'Squats', 'Deadlift', 'Bench Press', 'Shoulder Press', 'Rows', 'Lunges', 'Plank', 'Other'] },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' }
              ],
              rows: [['', '', '', '', '', ''], ['', '', '', '', '', ''], ['', '', '', '', '', '']]
            }],
            activeTableIndex: 0
          }
        },
        {
          id: 'meal-log',
          name: 'Meal & Diet Log',
          description: 'Track meals, calories, and nutrition',
          data: {
            tables: [{
              name: 'Meals',
              columns: ['Date', 'Meal', 'Food', 'Calories', 'Protein (g)', 'Notes'],
              columnWidths: [120, 120, 180, 100, 100, 180],
              columnTypes: [
                { type: 'date' },
                { type: 'dropdown', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' }
              ],
              rows: [['', '', '', '', '', ''], ['', '', '', '', '', ''], ['', '', '', '', '', '']]
            }],
            activeTableIndex: 0
          }
        }
      ]
    },
    {
      id: 'financial',
      name: 'Financial',
      icon: 'DollarSign',
      templates: [
        {
          id: 'expense-tracker',
          name: 'Expense Tracker',
          description: 'Track daily expenses and spending habits',
          data: {
            tables: [{
              name: 'Expenses',
              columns: ['Date', 'Category', 'Description', 'Amount ($)', 'Payment Method'],
              columnWidths: [120, 140, 200, 100, 140],
              columnTypes: [
                { type: 'date' },
                { type: 'dropdown', options: ['Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Health', 'Travel', 'Education', 'Other'] },
                { type: 'text' },
                { type: 'text' },
                { type: 'dropdown', options: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'PayPal', 'Venmo', 'Other'] }
              ],
              rows: [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']]
            }],
            activeTableIndex: 0
          }
        },
        {
          id: 'budget-planner',
          name: 'Budget Planner',
          description: 'Plan and track your monthly budget',
          data: {
            tables: [{
              name: 'Budget',
              columns: ['Category', 'Budgeted ($)', 'Actual ($)', 'Difference ($)', 'Notes'],
              columnWidths: [160, 120, 120, 120, 180],
              columnTypes: [
                { type: 'dropdown', options: ['Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 'Healthcare', 'Savings', 'Entertainment', 'Personal', 'Debt Payments', 'Other'] },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' }
              ],
              rows: [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']]
            }],
            activeTableIndex: 0
          }
        }
      ]
    },
    {
      id: 'productivity',
      name: 'Productivity',
      icon: 'Target',
      templates: [
        {
          id: 'task-tracker',
          name: 'Task Tracker',
          description: 'Manage tasks with status and priority',
          data: {
            tables: [{
              name: 'Tasks',
              columns: ['Task', 'Status', 'Priority', 'Due Date', 'Notes'],
              columnWidths: [200, 120, 100, 120, 180],
              columnTypes: [
                { type: 'text' },
                { type: 'dropdown', options: ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'] },
                { type: 'dropdown', options: ['High', 'Medium', 'Low'] },
                { type: 'date' },
                { type: 'text' }
              ],
              rows: [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']]
            }],
            activeTableIndex: 0
          }
        },
        {
          id: 'habit-tracker',
          name: 'Weekly Habit Tracker',
          description: 'Track daily habits throughout the week',
          data: {
            tables: [{
              name: 'Habits',
              columns: ['Habit', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              columnWidths: [180, 70, 70, 70, 70, 70, 70, 70],
              columnTypes: [
                { type: 'text' },
                { type: 'dropdown', options: ['✓', '✗', '-'] },
                { type: 'dropdown', options: ['✓', '✗', '-'] },
                { type: 'dropdown', options: ['✓', '✗', '-'] },
                { type: 'dropdown', options: ['✓', '✗', '-'] },
                { type: 'dropdown', options: ['✓', '✗', '-'] },
                { type: 'dropdown', options: ['✓', '✗', '-'] },
                { type: 'dropdown', options: ['✓', '✗', '-'] }
              ],
              rows: [['Exercise', '', '', '', '', '', '', ''], ['Read', '', '', '', '', '', '', ''], ['Meditate', '', '', '', '', '', '', ''], ['Water Intake', '', '', '', '', '', '', ''], ['Sleep 8hrs', '', '', '', '', '', '', '']]
            }],
            activeTableIndex: 0
          }
        }
      ]
    }
  ];

  // State for selected spreadsheet template
  const [selectedSpreadsheetTemplate, setSelectedSpreadsheetTemplate] = useState(null);

  const showNotif = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Notebook management functions
  const createNotebook = async () => {
    if (!newNotebookName.trim()) return;
    try {
      const newNotebook = await api.createNotebook(newNotebookName.trim(), 'notebook');
      setNotebooks(prev => [...prev, newNotebook]);
      setNewNotebookName('');
      setShowNewNotebook(false);
      setActiveNotebook(newNotebook.id);
      showNotif(`Created notebook "${newNotebook.name}"`);
    } catch (e) {
      console.error('Error creating notebook:', e);
      showNotif('Failed to create notebook');
    }
  };

  const deleteNotebook = async (notebookId) => {
    if (notebookId === 'note1') {
      showNotif('Cannot delete the Prompts notebook');
      return;
    }
    const notebook = notebooks.find(n => n.id === notebookId);
    if (confirm(`Delete notebook "${notebook?.name}" and all its notes?`)) {
      try {
        await api.deleteNotebook(notebookId);
        setNotebooks(prev => prev.filter(n => n.id !== notebookId));
        setNotes(prev => prev.filter(n => n.notebookId !== notebookId));
        if (activeNotebook === notebookId) {
          setActiveNotebook('note1');
        }
        showNotif(`Deleted notebook "${notebook?.name}"`);
      } catch (e) {
        console.error('Error deleting notebook:', e);
        showNotif('Failed to delete notebook');
      }
    }
  };

  const renameNotebook = async (notebookId, newName) => {
    if (!newName.trim()) return;
    try {
      await api.updateNotebook(notebookId, newName.trim());
      setNotebooks(prev => prev.map(n =>
        n.id === notebookId ? { ...n, name: newName.trim() } : n
      ));
    } catch (e) {
      console.error('Error renaming notebook:', e);
      showNotif('Failed to rename notebook');
    }
  };

  // Notes management functions
  const getNotesForNotebook = (notebookId) => {
    return notes
      .filter(n => n.notebookId === notebookId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  };

  const createNote = async () => {
    if (!noteForm.title.trim()) {
      showNotif('Please enter a title');
      return;
    }

    // Require spreadsheet template selection
    if (noteForm.type === 'spreadsheet' && !selectedSpreadsheetTemplate) {
      showNotif('Please select a spreadsheet template');
      return;
    }

    // Initialize content based on note type
    let initialContent = noteForm.content;
    if (noteForm.type === 'spreadsheet') {
      // Use selected template data or default blank spreadsheet
      if (selectedSpreadsheetTemplate?.data) {
        initialContent = JSON.stringify(selectedSpreadsheetTemplate.data);
      } else {
        // Blank spreadsheet with new structure
        initialContent = JSON.stringify({
          tables: [{
            name: 'Table 1',
            columns: ['Column A', 'Column B', 'Column C'],
            columnWidths: [150, 150, 150],
            columnTypes: [{ type: 'text' }, { type: 'text' }, { type: 'text' }],
            rows: [['', '', ''], ['', '', ''], ['', '', '']]
          }],
          activeTableIndex: 0
        });
      }
    }

    try {
      // Set template for prompt-type notes
      const template = noteForm.type === 'prompt' ? 'prompt' : null;
      const tags = noteForm.tags || [];

      const newNote = await api.createNote(activeNotebook, noteForm.title.trim(), initialContent, noteForm.type, template, tags);
      setNotes(prev => [...prev, newNote]);

      // Update global tags if new ones were added
      if (tags.length > 0) {
        const newTags = tags.filter(t => !data.tags.includes(t));
        if (newTags.length > 0) {
          setData(d => ({ ...d, tags: [...d.tags, ...newTags] }));
        }
      }

      setNoteForm({ title: '', content: '', type: 'text', tags: [] });
      setSelectedSpreadsheetTemplate(null);
      setShowNewNote(false);
      setActiveNote(newNote.id);
      showNotif('Note created');
    } catch (e) {
      console.error('Error creating note:', e);
      showNotif('Failed to create note');
    }
  };

  const updateNote = async (noteId, updates) => {
    try {
      const note = notes.find(n => n.id === noteId);
      const updatedNote = await api.updateNote(
        noteId,
        updates.title || note.title,
        updates.content !== undefined ? updates.content : note.content,
        updates.tags
      );
      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, ...updatedNote } : n
      ));
      setEditingNoteId(null);
      // Update global tags if new ones were added
      if (updates.tags) {
        const newTags = updates.tags.filter(t => !data.tags.includes(t));
        if (newTags.length > 0) {
          setData(d => ({ ...d, tags: [...d.tags, ...newTags] }));
        }
      }
      showNotif('Note updated');
    } catch (e) {
      console.error('Error updating note:', e);
      showNotif('Failed to update note');
    }
  };

  const deleteNote = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (confirm(`Delete note "${note?.title}"?`)) {
      try {
        await api.deleteNote(noteId);
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (activeNote === noteId) {
          setActiveNote(null);
        }
        showNotif('Note deleted');
      } catch (e) {
        console.error('Error deleting note:', e);
        showNotif('Failed to delete note');
      }
    }
  };

  const moveNoteToNotebook = async (noteId, targetNotebookId) => {
    try {
      const movedNote = await api.moveNote(noteId, targetNotebookId);
      setNotes(prev => prev.map(n => n.id === noteId ? movedNote : n));
      showNotif('Note moved successfully');
    } catch (e) {
      console.error('Error moving note:', e);
      showNotif('Failed to move note');
    }
  };

  const duplicateNoteToNotebook = async (noteId, targetNotebookId = null) => {
    try {
      const duplicatedNote = await api.duplicateNote(noteId, targetNotebookId);
      setNotes(prev => [...prev, duplicatedNote]);
      showNotif('Note duplicated successfully');
      return duplicatedNote;
    } catch (e) {
      console.error('Error duplicating note:', e);
      showNotif('Failed to duplicate note');
    }
  };

  const convertPromptToNoteInNotebook = async (promptId, targetNotebookId) => {
    try {
      const newNote = await api.convertPromptToNote(promptId, targetNotebookId);
      setNotes(prev => [...prev, newNote]);
      showNotif('Prompt converted to note successfully');
      return newNote;
    } catch (e) {
      console.error('Error converting prompt:', e);
      showNotif('Failed to convert prompt to note');
    }
  };

  const copyNoteContent = (content, noteId) => {
    navigator.clipboard.writeText(content);
    setCopiedNoteId(noteId);
    setTimeout(() => setCopiedNoteId(null), 2000);
    showNotif('Copied to clipboard');
  };

  // Drag and drop handlers for notes
  const handleNoteDragStart = (e, note) => {
    setDraggingNote(note);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', note.id);
    // Add a custom drag image or styling
    e.target.style.opacity = '0.5';
  };

  const handleNoteDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggingNote(null);
    setDragOverNotebook(null);
    setDragOverNoteIndex(null);
  };

  const handleNoteDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingNote) {
      setDragOverNoteIndex(index);
    }
  };

  const handleNotebookDragOver = (e, notebookId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingNote && draggingNote.notebookId !== notebookId) {
      setDragOverNotebook(notebookId);
    }
  };

  const handleNotebookDragLeave = (e) => {
    // Only clear if leaving the notebook element entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverNotebook(null);
    }
  };

  const handleNotebookDrop = async (e, notebookId) => {
    e.preventDefault();
    setDragOverNotebook(null);
    if (draggingNote && draggingNote.notebookId !== notebookId) {
      await moveNoteToNotebook(draggingNote.id, notebookId);
    }
    setDraggingNote(null);
  };

  const handleNoteListDrop = async (e, dropIndex) => {
    e.preventDefault();
    setDragOverNoteIndex(null);

    if (!draggingNote) return;

    const notebookNotes = getNotesForNotebook(activeNotebook);
    const dragIndex = notebookNotes.findIndex(n => n.id === draggingNote.id);

    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggingNote(null);
      return;
    }

    // Reorder notes
    const newNotes = [...notebookNotes];
    const [removed] = newNotes.splice(dragIndex, 1);
    newNotes.splice(dropIndex > dragIndex ? dropIndex - 1 : dropIndex, 0, removed);

    const newNoteIds = newNotes.map(n => n.id);

    // Optimistic update
    const updatedNotes = notes.map(n => {
      const newIndex = newNoteIds.indexOf(n.id);
      if (newIndex !== -1) {
        return { ...n, position: newIndex };
      }
      return n;
    });
    setNotes(updatedNotes);

    // Persist to server
    try {
      await api.reorderNotes(activeNotebook, newNoteIds);
    } catch (e) {
      console.error('Error reordering notes:', e);
      // Refresh notes on error
      const result = await api.getData();
      setNotes(result.notes || []);
    }

    setDraggingNote(null);
  };

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await api.getData();
        setData({ ...emptyData, ...result, tagCategories: result.tagCategories || [] });
        // Expand root folders by default
        const rootFolderIds = result.folders?.filter(f => !f.parentId).map(f => f.id) || [];
        setExpandedFolders(new Set(rootFolderIds));
        // Load notebooks and notes
        if (result.notebooks && result.notebooks.length > 0) {
          setNotebooks(result.notebooks);
          setActiveNotebook(result.notebooks[0].id);
        }
        if (result.notes) {
          setNotes(result.notes);
        }
      } catch (e) {
        console.error('Error loading data:', e);
        showNotif('Failed to load data from server');
      }
      setLoaded(true);
      setLoading(false);
    };
    loadData();
  }, []);

  const getChildFolders = (parentId) => data.folders.filter(f => f.parentId === parentId);
  const getFolderPrompts = (folderId) => data.prompts.filter(p => p.folderId === folderId);

  const getTagsInFolder = (folderId) => {
    if (!folderId) return [];
    const folderPrompts = data.prompts.filter(p => p.folderId === folderId);
    const tags = [...new Set(folderPrompts.flatMap(p => p.tags))];
    return tags;
  };

  const parseImportFile = (content, fileName) => {
    const prompts = [];
    const ext = fileName.split('.').pop().toLowerCase();

    if (ext === 'json') {
      try {
        const parsed = JSON.parse(content);
        // Check if this is a full backup with folders and prompts
        if (parsed.folders && parsed.prompts && Array.isArray(parsed.folders) && Array.isArray(parsed.prompts)) {
          return {
            isFullBackup: true,
            folders: parsed.folders,
            prompts: parsed.prompts.map(p => ({ ...p, selected: true })),
            tags: parsed.tags || [],
            tagCategories: parsed.tagCategories || []
          };
        }
        // Otherwise treat as simple array of prompts
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (item.title && item.content) {
              prompts.push({ title: item.title, content: item.content, tags: item.tags || [] });
            } else if (item.title && item.prompt) {
              prompts.push({ title: item.title, content: item.prompt, tags: item.tags || [] });
            }
          });
        }
      } catch (e) { }
    } else if (ext === 'csv') {
      const lines = content.split('\n');
      const header = lines[0]?.toLowerCase();
      const hasHeader = header?.includes('title') || header?.includes('prompt');
      const startIndex = hasHeader ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const match = line.match(/^"?([^",]+)"?,\s*"?([\s\S]+?)"?$/);
        if (match) {
          prompts.push({ title: match[1].trim(), content: match[2].trim().replace(/""/g, '"'), tags: [] });
        }
      }
    } else {
      // Pattern 1: Title: ... followed by Prompt (on its own line) then content
      const titlePromptBlockPattern = /Title:\s*(.+?)[\r\n]+(?:Prompt:?[\r\n]+)([\s\S]*?)(?=Title:\s|$)/gi;
      let match;
      while ((match = titlePromptBlockPattern.exec(content)) !== null) {
        const title = match[1].trim();
        const promptContent = match[2].trim();
        if (title && promptContent) {
          prompts.push({ title, content: promptContent, tags: [] });
        }
      }

      // Pattern 2: ## Title followed by content (Markdown)
      if (prompts.length === 0) {
        const mdPattern = /##\s*(.+?)\n([\s\S]*?)(?=\n##\s|\n---|\$)/g;
        while ((match = mdPattern.exec(content + '\n##')) !== null) {
          const title = match[1].trim();
          const promptContent = match[2].trim();
          if (title && promptContent) {
            prompts.push({ title, content: promptContent, tags: [] });
          }
        }
      }

      // Pattern 3: Title: ... Prompt: ... on same or next line with colon
      if (prompts.length === 0) {
        const titlePromptPattern = /(?:Title|Name):\s*(.+?)(?:\n|\r)+(?:Prompt|Content):\s*([\s\S]*?)(?=(?:Title|Name):|$)/gi;
        while ((match = titlePromptPattern.exec(content)) !== null) {
          const title = match[1].trim();
          const promptContent = match[2].trim();
          if (title && promptContent) {
            prompts.push({ title, content: promptContent, tags: [] });
          }
        }
      }

      // Pattern 4: --- separated blocks with first line as title
      if (prompts.length === 0) {
        const blocks = content.split(/\n---+\n/);
        blocks.forEach(block => {
          const lines = block.trim().split('\n');
          if (lines.length >= 2) {
            const title = lines[0].replace(/^#+\s*/, '').trim();
            const promptContent = lines.slice(1).join('\n').trim();
            if (title && promptContent) {
              prompts.push({ title, content: promptContent, tags: [] });
            }
          }
        });
      }
    }

    return { isFullBackup: false, prompts, folders: [] };
  };

  const handleBulkImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const result = parseImportFile(content, file.name);
      if (result.isFullBackup) {
        setBulkImportData({
          isFullBackup: true,
          folders: result.folders,
          prompts: result.prompts,
          tags: result.tags || [],
          tagCategories: result.tagCategories || [],
          folderId: null,
          fileName: file.name
        });
      } else {
        setBulkImportData(prev => ({
          ...prev,
          isFullBackup: false,
          folders: [],
          prompts: result.prompts,
          fileName: file.name
        }));
      }
    };
    reader.readAsText(file);
  };

  const executeBulkImport = async () => {
    // Handle full backup import with folders
    if (bulkImportData.isFullBackup) {
      const selectedPrompts = bulkImportData.prompts.filter(p => p.selected !== false);
      if (selectedPrompts.length === 0) return;

      try {
        // Create a mapping from old folder IDs to new folder IDs
        const folderIdMap = {};
        const createdFolders = [];

        // Sort folders to ensure parents are created before children
        const sortedFolders = [...bulkImportData.folders].sort((a, b) => {
          const aDepth = getImportFolderDepth(a, bulkImportData.folders);
          const bDepth = getImportFolderDepth(b, bulkImportData.folders);
          return aDepth - bDepth;
        });

        // Create folders via API
        for (const folder of sortedFolders) {
          const newParentId = folder.parentId ? folderIdMap[folder.parentId] : null;
          const newFolder = await api.createFolder(folder.name, newParentId);
          folderIdMap[folder.id] = newFolder.id;
          createdFolders.push(newFolder);
        }

        // Create prompts via API with mapped folder IDs
        const createdPrompts = [];
        for (const prompt of selectedPrompts) {
          const newFolderId = prompt.folderId ? folderIdMap[prompt.folderId] : null;
          if (newFolderId) {
            const newPrompt = await api.createPrompt(prompt.title, prompt.content, newFolderId, prompt.tags || []);
            createdPrompts.push(newPrompt);
          }
        }

        // Update local state
        const newTags = [...new Set(createdPrompts.flatMap(p => p.tags || []))].filter(t => !data.tags.includes(t));
        setData(d => ({
          ...d,
          folders: [...d.folders, ...createdFolders],
          prompts: [...d.prompts, ...createdPrompts],
          tags: [...d.tags, ...newTags]
        }));

        // Expand root folders
        const rootFolderIds = createdFolders.filter(f => !f.parentId).map(f => f.id);
        setExpandedFolders(prev => new Set([...prev, ...rootFolderIds]));

        setShowBulkImport(false);
        setBulkImportData({ prompts: [], folderId: null, tags: [], isFullBackup: false, folders: [] });
        showNotif(`Imported ${createdFolders.length} folders and ${createdPrompts.length} prompts`);
      } catch (e) {
        console.error('Failed to import:', e);
        showNotif('Failed to import some items');
      }
      return;
    }

    // Handle simple prompts import (existing behavior)
    if (!bulkImportData.folderId || bulkImportData.prompts.length === 0) return;

    try {
      const selectedPrompts = bulkImportData.prompts.filter(p => p.selected !== false);
      const createdPrompts = [];

      for (const p of selectedPrompts) {
        const tags = [...new Set([...(p.tags || []), ...bulkImportData.tags])];
        const newPrompt = await api.createPrompt(p.title, p.content, bulkImportData.folderId, tags);
        createdPrompts.push(newPrompt);
      }

      const newTags = [...new Set(createdPrompts.flatMap(p => p.tags || []))].filter(t => !data.tags.includes(t));

      setData(d => ({
        ...d,
        prompts: [...d.prompts, ...createdPrompts],
        tags: [...d.tags, ...newTags]
      }));

      setExpandedFolders(prev => new Set([...prev, bulkImportData.folderId]));
      setShowBulkImport(false);
      setBulkImportData({ prompts: [], folderId: null, tags: [], isFullBackup: false, folders: [] });
      showNotif(`Imported ${createdPrompts.length} prompts`);
    } catch (e) {
      console.error('Failed to import:', e);
      showNotif('Failed to import prompts');
    }
  };

  // Helper function to get folder depth for sorting during import
  const getImportFolderDepth = (folder, allFolders) => {
    let depth = 0;
    let current = folder;
    while (current.parentId) {
      depth++;
      current = allFolders.find(f => f.id === current.parentId);
      if (!current) break;
    }
    return depth;
  };

  const toggleBulkImportPrompt = (index) => {
    setBulkImportData(prev => ({
      ...prev,
      prompts: prev.prompts.map((p, i) => i === index ? { ...p, selected: p.selected === false ? true : false } : p)
    }));
  };

  const addTagCategory = async (name) => {
    try {
      const newCategory = await api.createTagCategory(name, []);
      setData(d => ({ ...d, tagCategories: [...(d.tagCategories || []), newCategory] }));
    } catch (e) {
      console.error('Failed to create tag category:', e);
      showNotif('Failed to create tag category');
    }
  };

  const updateTagCategory = async (id, name) => {
    const category = (data.tagCategories || []).find(c => c.id === id);
    try {
      await api.updateTagCategory(id, name, category?.tags || []);
      setData(d => ({ ...d, tagCategories: (d.tagCategories || []).map(c => c.id === id ? { ...c, name } : c) }));
    } catch (e) {
      console.error('Failed to update tag category:', e);
      showNotif('Failed to update tag category');
    }
  };

  const deleteTagCategory = async (id) => {
    try {
      await api.deleteTagCategory(id);
      setData(d => ({ ...d, tagCategories: (d.tagCategories || []).filter(c => c.id !== id) }));
    } catch (e) {
      console.error('Failed to delete tag category:', e);
      showNotif('Failed to delete tag category');
    }
  };

  const assignTagToCategory = async (tag, categoryId) => {
    const category = (data.tagCategories || []).find(c => c.id === categoryId);
    const newTags = [...new Set([...(category?.tags || []), tag])];
    try {
      await api.updateTagCategory(categoryId, category?.name || '', newTags);
      setData(d => ({
        ...d,
        tagCategories: (d.tagCategories || []).map(c => ({
          ...c,
          tags: c.id === categoryId
            ? [...new Set([...c.tags, tag])]
            : c.tags
        }))
      }));
    } catch (e) {
      console.error('Failed to assign tag to category:', e);
      showNotif('Failed to assign tag');
    }
  };

  const removeTagFromCategory = async (tag, categoryId) => {
    const category = (data.tagCategories || []).find(c => c.id === categoryId);
    const newTags = (category?.tags || []).filter(t => t !== tag);
    try {
      await api.updateTagCategory(categoryId, category?.name || '', newTags);
      setData(d => ({
        ...d,
        tagCategories: (d.tagCategories || []).map(c =>
          c.id === categoryId ? { ...c, tags: c.tags.filter(t => t !== tag) } : c
        )
      }));
    } catch (e) {
      console.error('Failed to remove tag from category:', e);
      showNotif('Failed to remove tag');
    }
  };

  const getUncategorizedTags = () => {
    const categorizedTags = (data.tagCategories || []).flatMap(c => c.tags);
    return data.tags.filter(t => !categorizedTags.includes(t));
  };

  const FolderPathSelector = ({
    selectedFolderId,
    onSelect,
    folders,
    firstOptionLabel = 'None (Root level)',
    subfolderOptionLabel = 'Select subfolder...',
    summaryPrefix = 'New folder will be created in:',
    includeRootInSearch = false,
    searchPlaceholder = 'Search all folders and subfolders (name or path)…',
  }) => {
    const [folderSearchQuery, setFolderSearchQuery] = useState('');

    const getAncestorPath = (folderId) => {
      const path = [];
      let currentId = folderId;
      while (currentId) {
        const folder = folders.find(f => f.id === currentId);
        if (folder) {
          path.unshift(folder);
          currentId = folder.parentId;
        } else {
          break;
        }
      }
      return path;
    };

    const query = folderSearchQuery.trim().toLowerCase();
    const filteredSearchResults = useMemo(() => {
      const raw = folderSearchQuery.trim();
      if (!raw) return [];

      const tokenize = (s) =>
        s
          .toLowerCase()
          .split(/[\s/]+/)
          .filter(Boolean);

      const matchesUniversalFolderQuery = (pathLabel, segmentNames, rawQuery) => {
        const tokens = tokenize(rawQuery);
        if (tokens.length === 0) return false;
        const haystack = [pathLabel.toLowerCase(), ...segmentNames.map((x) => x.toLowerCase())].join(' ');
        return tokens.every((tok) => haystack.includes(tok));
      };

      const rootOptionMatchesQuery = (rawQuery) => {
        const tokens = tokenize(rawQuery);
        if (tokens.length === 0) return false;
        const label = firstOptionLabel.toLowerCase();
        if (tokens.every((t) => label.includes(t))) return true;
        if (tokens.length === 1 && ['root', '/', 'top', 'none'].includes(tokens[0])) return true;
        return false;
      };

      const pathPartsForFolder = (folderId) => {
        const segments = [];
        let id = folderId;
        while (id) {
          const f = folders.find((x) => x.id === id);
          if (!f) break;
          segments.unshift(f.name);
          id = f.parentId;
        }
        return { pathLabel: segments.join(' / '), segments };
      };
      const rows = [];
      const seen = new Set();
      if (includeRootInSearch && rootOptionMatchesQuery(folderSearchQuery)) {
        rows.push({ id: null, label: firstOptionLabel });
        seen.add(null);
      }
      // Full flat list: every root and nested subfolder is a row in `folders`.
      for (const f of folders) {
        const { pathLabel, segments } = pathPartsForFolder(f.id);
        const segmentNames = segments.length > 0 ? segments : [f.name];
        if (matchesUniversalFolderQuery(pathLabel || f.name, segmentNames, folderSearchQuery)) {
          if (!seen.has(f.id)) {
            seen.add(f.id);
            rows.push({ id: f.id, label: pathLabel || f.name });
          }
        }
      }
      return rows.sort((a, b) => {
        if (a.id === null) return -1;
        if (b.id === null) return 1;
        return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
      });
    }, [folderSearchQuery, folders, includeRootInSearch, firstOptionLabel]);

    const ancestorPath = selectedFolderId ? getAncestorPath(selectedFolderId) : [];
    const rootFolders = folders.filter(f => f.parentId === null);

    const getChildrenOf = (parentId) => folders.filter(f => f.parentId === parentId);

    const handleSelectAtLevel = (level, folderId) => {
      onSelect(folderId || null);
    };

    const levels = [{ parentId: null, folders: rootFolders }];

    for (let i = 0; i < ancestorPath.length; i++) {
      const children = getChildrenOf(ancestorPath[i].id);
      if (children.length > 0 || i < ancestorPath.length - 1) {
        levels.push({ parentId: ancestorPath[i].id, folders: children });
      }
    }

    if (selectedFolderId) {
      const selectedChildren = getChildrenOf(selectedFolderId);
      if (selectedChildren.length > 0 && (ancestorPath.length === 0 || ancestorPath[ancestorPath.length - 1]?.id !== selectedFolderId)) {
        levels.push({ parentId: selectedFolderId, folders: selectedChildren });
      }
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="search"
            value={folderSearchQuery}
            onChange={(e) => setFolderSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-zinc-900 border border-zinc-700 rounded pl-8 pr-3 py-2 text-sm placeholder:text-zinc-500"
            aria-label="Search folders"
          />
          {query ? (
            <ul
              className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded border border-zinc-600 bg-zinc-900 py-1 shadow-lg"
              role="listbox"
            >
              {filteredSearchResults.length === 0 ? (
                <li className="px-3 py-2 text-xs text-zinc-500">No matching folders</li>
              ) : (
                filteredSearchResults.map((row) => (
                  <li key={row.id === null ? '__root__' : row.id} role="option">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded-sm"
                      onClick={() => {
                        onSelect(row.id);
                        setFolderSearchQuery('');
                      }}
                    >
                      {row.id === null ? <span className="text-zinc-300">{row.label}</span> : row.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
        {levels.map((level, index) => {
          const selectedAtThisLevel = index < ancestorPath.length ? ancestorPath[index]?.id : (index === ancestorPath.length ? selectedFolderId : '');
          const hasSubfolders = level.folders.length > 0;

          if (!hasSubfolders && index > 0) return null;

          return (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={14} className="text-zinc-500 flex-shrink-0" />}
              <select
                value={selectedAtThisLevel || ''}
                onChange={(e) => handleSelectAtLevel(index, e.target.value || null)}
                className="flex-1 bg-zinc-900 rounded px-3 py-2 text-sm"
              >
                <option value="">{index === 0 ? firstOptionLabel : subfolderOptionLabel}</option>
                {level.folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          );
        })}
        {selectedFolderId && (
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <Folder size={12} className="text-yellow-500" />
            {summaryPrefix}{' '}
            <span className="text-zinc-200">{getAncestorPath(selectedFolderId).map(f => f.name).join(' / ')}</span>
          </div>
        )}
      </div>
    );
  };

  const getFilteredPrompts = (folderId) => {
    return data.prompts.filter(p => {
      const matchesFolder = p.folderId === folderId;
      const matchesSearch = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => p.tags.includes(t));
      return matchesFolder && matchesSearch && matchesTags;
    });
  };

  // Get total prompts count including all nested subfolders (recursive)
  const getTotalPromptsInFolder = (folderId) => {
    let count = getFilteredPrompts(folderId).length;
    const children = getChildFolders(folderId);
    children.forEach(child => {
      count += getTotalPromptsInFolder(child.id);
    });
    return count;
  };

  // Get total subfolders count including all nested levels (recursive)
  const getTotalSubfoldersInFolder = (folderId) => {
    const children = getChildFolders(folderId);
    let count = children.length;
    children.forEach(child => {
      count += getTotalSubfoldersInFolder(child.id);
    });
    return count;
  };

  // Get sorted child folders based on current sort setting
  const getSortedChildFolders = (parentId) => {
    const children = getChildFolders(parentId);
    if (folderSort === 'name') {
      return children.sort((a, b) => a.name.localeCompare(b.name));
    } else if (folderSort === 'prompts') {
      return children.sort((a, b) => getTotalPromptsInFolder(b.id) - getTotalPromptsInFolder(a.id));
    } else if (folderSort === 'subfolders') {
      return children.sort((a, b) => getTotalSubfoldersInFolder(b.id) - getTotalSubfoldersInFolder(a.id));
    }
    return children;
  };

  const folderHasMatchingContent = (folderId) => {
    if (getFilteredPrompts(folderId).length > 0) return true;
    const children = getChildFolders(folderId);
    return children.some(child => folderHasMatchingContent(child.id));
  };

  const togglePrompt = (id) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllPromptsInFolder = (folderId) => {
    const folderPrompts = getFilteredPrompts(folderId);
    const promptIds = folderPrompts.map(p => p.id);
    const allExpanded = promptIds.every(id => expandedPrompts.has(id));

    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (allExpanded) {
        // Collapse all prompts in this folder
        promptIds.forEach(id => next.delete(id));
      } else {
        // Expand all prompts in this folder
        promptIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const areAllPromptsExpanded = (folderId) => {
    const folderPrompts = getFilteredPrompts(folderId);
    if (folderPrompts.length === 0) return false;
    return folderPrompts.every(p => expandedPrompts.has(p.id));
  };

  const expandAllFolders = () => {
    setExpandedFolders(new Set(data.folders.map(f => f.id)));
  };

  const collapseAllFolders = () => {
    setExpandedFolders(new Set());
    setExpandedPrompts(new Set());
  };

  const areAllFoldersExpanded = () => {
    return data.folders.length > 0 && expandedFolders.size === data.folders.length;
  };

  const toggleAllFolders = () => {
    if (areAllFoldersExpanded()) {
      collapseAllFolders();
    } else {
      expandAllFolders();
    }
  };

  // Helper function to get display content for a prompt (handles structured prompts)
  const getPromptDisplayContent = (content) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed._structured) {
        // Generate combined prompt from structured fields
        const sections = [];
        if (parsed.roleDetails?.trim()) {
          sections.push(`## Role\n${parsed.roleDetails.trim()}`);
        }
        if (parsed.objective?.trim()) {
          sections.push(`## Objective\n${parsed.objective.trim()}`);
        }
        if (parsed.tasks?.trim()) {
          sections.push(`## Tasks\n${parsed.tasks.trim()}`);
        }
        if (parsed.successCriteria?.trim()) {
          sections.push(`## Success Criteria\n${parsed.successCriteria.trim()}`);
        }
        if (parsed.constraints?.trim()) {
          sections.push(`## Constraints\n${parsed.constraints.trim()}`);
        }
        if (parsed.outputRequirements?.trim()) {
          sections.push(`## Output Requirements\n${parsed.outputRequirements.trim()}`);
        }
        return sections.join('\n\n');
      }
    } catch {}
    return content;
  };

  // Check if a prompt is structured
  const isStructuredPrompt = (content) => {
    try {
      const parsed = JSON.parse(content);
      return parsed._structured === true;
    } catch {}
    return false;
  };

  const copyPrompt = (content, id) => {
    try {
      const displayContent = getPromptDisplayContent(content);
      const textArea = document.createElement('textarea');
      textArea.value = displayContent;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const toggleFolder = (id) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addFolder = async (name, parentId) => {
    try {
      const newFolder = await api.createFolder(name, parentId);
      setData(d => ({ ...d, folders: [...d.folders, newFolder] }));
      if (parentId) setExpandedFolders(prev => new Set([...prev, parentId]));
      setShowNewFolder(false);
      setNewFolderParent(null);
      if (showNewPrompt || editingPrompt) {
        setCreatedFolderIdForPrompt(newFolder.id);
      }
      showNotif('Folder created');
    } catch (e) {
      console.error('Failed to create folder:', e);
      showNotif('Failed to create folder');
    }
  };

  const updateFolder = async (id, name) => {
    const folder = data.folders.find(f => f.id === id);
    try {
      const updated = await api.updateFolder(id, name, folder?.parentId || null);
      setData(d => ({ ...d, folders: d.folders.map(f => f.id === id ? { ...f, ...updated } : f) }));
      showNotif('Folder updated');
    } catch (e) {
      console.error('Failed to update folder:', e);
      showNotif('Failed to update folder');
    }
    setEditingFolder(null);
  };

  const getAllDescendantFolderIds = (folderId) => {
    const children = getChildFolders(folderId);
    return [folderId, ...children.flatMap(c => getAllDescendantFolderIds(c.id))];
  };

  const deleteFolder = async (id) => {
    const descendantIds = getAllDescendantFolderIds(id);
    try {
      await api.deleteFolder(id);
      setData(d => ({
        ...d,
        folders: d.folders.filter(f => !descendantIds.includes(f.id)),
        prompts: d.prompts.filter(p => !descendantIds.includes(p.folderId))
      }));
      showNotif('Folder deleted');
    } catch (e) {
      console.error('Failed to delete folder:', e);
      showNotif('Failed to delete folder');
    }
  };

  // Find folders with duplicate names (case-insensitive)
  // If parentId is provided, only look at direct children of that folder
  const findDuplicateFolders = (scopeParentId = null) => {
    const foldersByName = {};
    const foldersToCheck = scopeParentId !== null
      ? data.folders.filter(f => f.parentId === scopeParentId)
      : data.folders;

    foldersToCheck.forEach(folder => {
      const normalizedName = folder.name.toLowerCase().trim();
      if (!foldersByName[normalizedName]) {
        foldersByName[normalizedName] = [];
      }
      foldersByName[normalizedName].push(folder);
    });

    // Filter to only groups with more than one folder
    const duplicates = Object.entries(foldersByName)
      .filter(([_, folders]) => folders.length > 1)
      .map(([name, folders]) => ({
        name: folders[0].name, // Use original case from first folder
        folders: folders.map(f => ({
          ...f,
          promptCount: data.prompts.filter(p => p.folderId === f.id).length,
          subfolderCount: data.folders.filter(sf => sf.parentId === f.id).length,
          path: getFolderPath(f.id)
        })),
        targetId: folders[0].id // Default to first folder as merge target
      }));

    return duplicates;
  };

  // Check if a folder has duplicate subfolders
  const hasDuplicateSubfolders = (folderId) => {
    const children = data.folders.filter(f => f.parentId === folderId);
    const names = children.map(f => f.name.toLowerCase().trim());
    return names.length !== new Set(names).size;
  };

  // Find duplicate prompts in a folder (by title)
  const findDuplicatePrompts = (folderId) => {
    const prompts = data.prompts.filter(p => p.folderId === folderId);
    const titleMap = new Map();

    prompts.forEach(prompt => {
      const key = prompt.title.toLowerCase().trim();
      if (!titleMap.has(key)) {
        titleMap.set(key, []);
      }
      titleMap.get(key).push(prompt);
    });

    // Filter to only groups with duplicates
    const duplicates = [];
    titleMap.forEach((group, title) => {
      if (group.length > 1) {
        duplicates.push({
          title: group[0].title,
          prompts: group,
          keepId: group[0].id // Default to keeping the first one
        });
      }
    });

    return duplicates;
  };

  // Check if a folder has duplicate prompts
  const hasDuplicatePrompts = (folderId) => {
    const prompts = data.prompts.filter(p => p.folderId === folderId);
    const titles = prompts.map(p => p.title.toLowerCase().trim());
    return titles.length !== new Set(titles).size;
  };

  // Open the duplicate prompts modal
  const openDuplicatePrompts = (folderId) => {
    const duplicates = findDuplicatePrompts(folderId);
    setDuplicatePromptGroups(duplicates);
    setDuplicatePromptsFolderId(folderId);
    setShowDuplicatePrompts(true);
  };

  // Set which prompt to keep in a duplicate group
  const setKeepPrompt = (groupIndex, promptId) => {
    setDuplicatePromptGroups(prev => prev.map((group, i) =>
      i === groupIndex ? { ...group, keepId: promptId } : group
    ));
  };

  // Delete duplicate prompts (keeping selected ones)
  const deleteDuplicatePrompts = async () => {
    let deletedCount = 0;

    for (const group of duplicatePromptGroups) {
      const toDelete = group.prompts.filter(p => p.id !== group.keepId);
      for (const prompt of toDelete) {
        try {
          await api.deletePrompt(prompt.id);
          deletedCount++;
        } catch (e) {
          console.error('Error deleting prompt:', e);
        }
      }
    }

    // Refresh data
    const result = await api.getData();
    setData({ ...emptyData, ...result, tagCategories: result.tagCategories || [] });

    setShowDuplicatePrompts(false);
    setDuplicatePromptGroups([]);
    setDuplicatePromptsFolderId(null);
    showNotif(`Deleted ${deletedCount} duplicate prompt${deletedCount !== 1 ? 's' : ''}`);
  };

  const openMergeDuplicates = (scopeParentId = null) => {
    const duplicates = findDuplicateFolders(scopeParentId);
    setDuplicateFolders(duplicates);
    setMergeScopeParentId(scopeParentId);
    // Expand all groups by default
    setExpandedDuplicateGroups(new Set(duplicates.map((_, i) => i)));
    setShowMergeDuplicates(true);
  };

  const toggleDuplicateGroup = (groupIndex) => {
    setExpandedDuplicateGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupIndex)) {
        next.delete(groupIndex);
      } else {
        next.add(groupIndex);
      }
      return next;
    });
  };

  const setMergeTarget = (groupIndex, targetId) => {
    setDuplicateFolders(prev => prev.map((group, i) =>
      i === groupIndex ? { ...group, targetId } : group
    ));
  };

  // Merge a single group of duplicates
  const mergeSingleGroup = async (groupIndex) => {
    const group = duplicateFolders[groupIndex];
    const targetId = group.targetId;
    const foldersToMerge = group.folders.filter(f => f.id !== targetId);

    let promptsMoved = 0;
    let subfoldersMoved = 0;

    try {
      for (const folder of foldersToMerge) {
        // Move all prompts from this folder to target
        const promptsToMove = data.prompts.filter(p => p.folderId === folder.id);
        for (const prompt of promptsToMove) {
          await api.updatePrompt(prompt.id, prompt.title, prompt.content, targetId, prompt.tags || []);
          promptsMoved++;
        }

        // Move all direct subfolders from this folder to target
        const subfoldersToMove = data.folders.filter(f => f.parentId === folder.id);
        for (const subfolder of subfoldersToMove) {
          await api.updateFolder(subfolder.id, subfolder.name, targetId);
          subfoldersMoved++;
        }

        // Delete the now-empty folder
        await api.deleteFolder(folder.id);
      }

      // Reload data to get fresh state
      const freshData = await api.getData();
      setData(freshData);

      // Remove this group from the list
      setDuplicateFolders(prev => prev.filter((_, i) => i !== groupIndex));
      // Update expanded groups indices
      setExpandedDuplicateGroups(prev => {
        const next = new Set();
        prev.forEach(i => {
          if (i < groupIndex) next.add(i);
          else if (i > groupIndex) next.add(i - 1);
        });
        return next;
      });

      showNotif(`Merged "${group.name}": moved ${promptsMoved} prompts and ${subfoldersMoved} subfolders`);
    } catch (e) {
      console.error('Failed to merge folder group:', e);
      showNotif('Failed to merge folders');
    }
  };

  // Merge all duplicate groups
  const executeMergeDuplicates = async () => {
    let totalMerged = 0;
    let totalPromptsMoved = 0;
    let totalSubfoldersMoved = 0;

    try {
      for (const group of duplicateFolders) {
        const targetId = group.targetId;
        const foldersToMerge = group.folders.filter(f => f.id !== targetId);

        for (const folder of foldersToMerge) {
          // Move all prompts from this folder to target
          const promptsToMove = data.prompts.filter(p => p.folderId === folder.id);
          for (const prompt of promptsToMove) {
            await api.updatePrompt(prompt.id, prompt.title, prompt.content, targetId, prompt.tags || []);
            totalPromptsMoved++;
          }

          // Move all direct subfolders from this folder to target
          const subfoldersToMove = data.folders.filter(f => f.parentId === folder.id);
          for (const subfolder of subfoldersToMove) {
            await api.updateFolder(subfolder.id, subfolder.name, targetId);
            totalSubfoldersMoved++;
          }

          // Delete the now-empty folder
          await api.deleteFolder(folder.id);
          totalMerged++;
        }
      }

      // Reload data to get fresh state
      const freshData = await api.getData();
      setData(freshData);

      setShowMergeDuplicates(false);
      setDuplicateFolders([]);
      setExpandedDuplicateGroups(new Set());
      setMergeScopeParentId(null);
      showNotif(`Merged ${totalMerged} folders, moved ${totalPromptsMoved} prompts and ${totalSubfoldersMoved} subfolders`);
    } catch (e) {
      console.error('Failed to merge folders:', e);
      showNotif('Failed to merge some folders');
    }
  };

  const addPrompt = async (prompt) => {
    try {
      const newPrompt = await api.createPrompt(prompt.title, prompt.content, prompt.folderId, prompt.tags);
      const newTags = prompt.tags.filter(t => !data.tags.includes(t));
      setData(d => ({
        ...d,
        prompts: [...d.prompts, newPrompt],
        tags: [...d.tags, ...newTags]
      }));
      setShowNewPrompt(false);
      setNewPromptFolder(null);
      setExpandedPrompts(prev => new Set([...prev, newPrompt.id]));
      showNotif('Prompt created');
    } catch (e) {
      console.error('Failed to create prompt:', e);
      showNotif('Failed to create prompt');
    }
  };

  const updatePrompt = async (id, updates) => {
    try {
      const updated = await api.updatePrompt(id, updates.title, updates.content, updates.folderId, updates.tags || []);
      const newTags = updates.tags?.filter(t => !data.tags.includes(t)) || [];
      setData(d => ({
        ...d,
        prompts: d.prompts.map(p => p.id === id ? { ...p, ...updated } : p),
        tags: [...d.tags, ...newTags]
      }));
      showNotif('Prompt updated');
    } catch (e) {
      console.error('Failed to update prompt:', e);
      showNotif('Failed to update prompt');
    }
    setEditingPrompt(null);
  };

  const deletePrompt = async (id) => {
    try {
      await api.deletePrompt(id);
      setData(d => ({ ...d, prompts: d.prompts.filter(p => p.id !== id) }));
      showNotif('Prompt deleted');
    } catch (e) {
      console.error('Failed to delete prompt:', e);
      showNotif('Failed to delete prompt');
    }
  };

  const movePrompt = async (promptId, newFolderId) => {
    const prompt = data.prompts.find(p => p.id === promptId);
    const targetFolder = data.folders.find(f => f.id === newFolderId);
    if (prompt && targetFolder && prompt.folderId !== newFolderId) {
      try {
        await api.updatePrompt(promptId, prompt.title, prompt.content, newFolderId, prompt.tags);
        setData(d => ({
          ...d,
          prompts: d.prompts.map(p => p.id === promptId ? { ...p, folderId: newFolderId } : p)
        }));
        setMoveNotification(`Moved "${prompt.title}" to "${targetFolder.name}"`);
        setTimeout(() => setMoveNotification(null), 2500);
        setExpandedFolders(prev => new Set([...prev, newFolderId]));
        setExpandedPrompts(prev => new Set([...prev, promptId]));
      } catch (e) {
        console.error('Failed to move prompt:', e);
        showNotif('Failed to move prompt');
      }
    }
  };

  // Bulk selection helpers
  const togglePromptSelection = (promptId) => {
    setSelectedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(promptId)) {
        next.delete(promptId);
      } else {
        next.add(promptId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedPrompts(new Set());
  };

  const selectAllInFolder = (folderId) => {
    const folderPrompts = data.prompts.filter(p => p.folderId === folderId);
    setSelectedPrompts(prev => {
      const next = new Set(prev);
      folderPrompts.forEach(p => next.add(p.id));
      return next;
    });
  };

  // Bulk actions
  const bulkDeletePrompts = async () => {
    if (selectedPrompts.size === 0) return;

    const count = selectedPrompts.size;
    if (!confirm(`Are you sure you want to delete ${count} prompt${count > 1 ? 's' : ''}? This cannot be undone.`)) {
      return;
    }

    try {
      for (const promptId of selectedPrompts) {
        await api.deletePrompt(promptId);
      }
      setData(d => ({
        ...d,
        prompts: d.prompts.filter(p => !selectedPrompts.has(p.id))
      }));
      showNotif(`Deleted ${count} prompt${count > 1 ? 's' : ''}`);
      clearSelection();
    } catch (e) {
      console.error('Failed to delete prompts:', e);
      showNotif('Failed to delete some prompts');
    }
  };

  const bulkMovePrompts = async (targetFolderId) => {
    if (selectedPrompts.size === 0) return;

    const count = selectedPrompts.size;
    const targetFolder = data.folders.find(f => f.id === targetFolderId);

    try {
      for (const promptId of selectedPrompts) {
        const prompt = data.prompts.find(p => p.id === promptId);
        if (prompt && prompt.folderId !== targetFolderId) {
          await api.updatePrompt(promptId, prompt.title, prompt.content, targetFolderId, prompt.tags);
        }
      }
      setData(d => ({
        ...d,
        prompts: d.prompts.map(p =>
          selectedPrompts.has(p.id) ? { ...p, folderId: targetFolderId } : p
        )
      }));
      showNotif(`Moved ${count} prompt${count > 1 ? 's' : ''} to "${targetFolder?.name}"`);
      clearSelection();
      setShowBulkMove(false);
      setExpandedFolders(prev => new Set([...prev, targetFolderId]));
    } catch (e) {
      console.error('Failed to move prompts:', e);
      showNotif('Failed to move some prompts');
    }
  };

  const createFolderInBulkMove = async () => {
    const { name, parentId } = bulkMoveNewFolder;
    if (!name.trim()) return;

    try {
      const newFolder = await api.createFolder(name.trim(), parentId);
      setData(d => ({ ...d, folders: [...d.folders, newFolder] }));
      if (parentId) setExpandedFolders(prev => new Set([...prev, parentId]));
      setBulkMoveNewFolder({ show: false, parentId: null, name: '' });
      showNotif(`Created folder "${name.trim()}"`);
    } catch (e) {
      console.error('Failed to create folder:', e);
      showNotif('Failed to create folder');
    }
  };

  const exportData = () => {
    try {
      const exportPayload = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        folders: data.folders,
        prompts: data.prompts,
        tags: data.tags,
        tagCategories: data.tagCategories || [],
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-repository-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotification('Backup downloaded successfully!');
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleBackupFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        // Validate structure
        if (imported.folders && imported.prompts) {
          const folderCount = imported.folders.length;
          const promptCount = imported.prompts.length;
          const tagCount = imported.tags?.length || 0;
          const categoryCount = imported.tagCategories?.length || 0;

          // Build folder tree preview
          const getRootFolders = () => imported.folders.filter(f => !f.parentId);
          const getChildCount = (folderId) => {
            const children = imported.folders.filter(f => f.parentId === folderId);
            return children.length + children.reduce((sum, c) => sum + getChildCount(c.id), 0);
          };

          setBackupPreview({
            valid: true,
            fileName: file.name,
            exportDate: imported.exportDate,
            version: imported.version,
            folderCount,
            promptCount,
            tagCount,
            categoryCount,
            rootFolders: getRootFolders(),
            data: imported,
          });
        } else {
          setBackupPreview({ valid: false, error: 'Invalid backup file structure' });
        }
      } catch (err) {
        setBackupPreview({ valid: false, error: 'Failed to parse file. Make sure it\'s a valid JSON backup.' });
      }
    };
    reader.readAsText(file);
  };

  const restoreFromBackup = (mode = 'replace') => {
    if (!backupPreview?.valid || !backupPreview.data) return;

    const imported = backupPreview.data;

    if (mode === 'replace') {
      // Full replace - clear existing and restore from backup
      setData({
        folders: imported.folders || [],
        prompts: imported.prompts || [],
        tags: imported.tags || [],
        tagCategories: imported.tagCategories || [],
      });
      showNotif(`Restored ${imported.prompts.length} prompts in ${imported.folders.length} folders!`);
    } else if (mode === 'merge') {
      // Merge - add new items, skip duplicates by name
      const existingFolderNames = new Set(data.folders.map(f => `${f.name}-${f.parentId}`));
      const existingPromptTitles = new Set(data.prompts.map(p => `${p.title}-${p.folderId}`));

      // Create ID mapping for folders
      const folderIdMap = {};
      const newFolders = [];

      // First pass - map root folders
      imported.folders.filter(f => !f.parentId).forEach(f => {
        const key = `${f.name}-null`;
        const existing = data.folders.find(ef => `${ef.name}-${ef.parentId}` === key);
        if (existing) {
          folderIdMap[f.id] = existing.id;
        } else {
          const newId = generateId();
          folderIdMap[f.id] = newId;
          newFolders.push({ ...f, id: newId, parentId: null });
        }
      });

      // Second pass - map child folders (iteratively for deep nesting)
      let remaining = imported.folders.filter(f => f.parentId);
      let iterations = 0;
      while (remaining.length > 0 && iterations < 10) {
        const stillRemaining = [];
        remaining.forEach(f => {
          if (folderIdMap[f.parentId] !== undefined) {
            const newParentId = folderIdMap[f.parentId];
            const key = `${f.name}-${newParentId}`;
            const existing = data.folders.find(ef => `${ef.name}-${ef.parentId}` === key) ||
              newFolders.find(nf => `${nf.name}-${nf.parentId}` === key);
            if (existing) {
              folderIdMap[f.id] = existing.id;
            } else {
              const newId = generateId();
              folderIdMap[f.id] = newId;
              newFolders.push({ ...f, id: newId, parentId: newParentId });
            }
          } else {
            stillRemaining.push(f);
          }
        });
        remaining = stillRemaining;
        iterations++;
      }

      // Map prompts to new folder IDs
      const newPrompts = imported.prompts
        .filter(p => {
          const newFolderId = folderIdMap[p.folderId];
          const key = `${p.title}-${newFolderId}`;
          return !existingPromptTitles.has(key);
        })
        .map(p => ({
          ...p,
          id: generateId(),
          folderId: folderIdMap[p.folderId] || p.folderId,
        }));

      // Merge tags
      const allTags = [...new Set([...data.tags, ...(imported.tags || [])])];

      // Merge tag categories
      const existingCategoryNames = new Set((data.tagCategories || []).map(c => c.name));
      const newCategories = (imported.tagCategories || [])
        .filter(c => !existingCategoryNames.has(c.name))
        .map(c => ({ ...c, id: generateId() }));

      setData(d => ({
        folders: [...d.folders, ...newFolders],
        prompts: [...d.prompts, ...newPrompts],
        tags: allTags,
        tagCategories: [...(d.tagCategories || []), ...newCategories],
      }));

      showNotif(`Merged ${newPrompts.length} prompts and ${newFolders.length} folders!`);
    }

    setShowBackupRestore(false);
    setBackupPreview(null);

    // Expand all folders to show restored content
    setExpandedFolders(new Set(data.folders.map(f => f.id)));
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.folders && imported.prompts) setData(imported);
      } catch (err) { }
    };
    reader.readAsText(file);
  };

  const PromptAccordion = ({ prompt }) => {
    const isExpanded = expandedPrompts.has(prompt.id);
    const isSelected = selectedPrompts.has(prompt.id);
    return (
      <div className={`border rounded-lg overflow-hidden bg-zinc-800/50 ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700'}`}>
        <div
          onClick={() => togglePrompt(prompt.id)}
          className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-zinc-700/50 transition-colors"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); togglePromptSelection(prompt.id); }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
          />
          {isExpanded ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
          <FileText size={14} className="text-blue-400" />
          <span className="flex-1 text-sm font-medium truncate">{prompt.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); copyPrompt(prompt.content, prompt.id); }}
            className={`p-1.5 rounded transition-colors ${copiedId === prompt.id ? 'bg-green-600 text-white' : 'hover:bg-zinc-600 text-zinc-400 hover:text-white'}`}
            title={copiedId === prompt.id ? 'Copied!' : 'Copy prompt'}
          >
            {copiedId === prompt.id ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <div className="flex items-center gap-1">
            {prompt.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-zinc-700 rounded">{tag}</span>
            ))}
            {prompt.tags.length > 2 && <span className="text-xs text-zinc-500">+{prompt.tags.length - 2}</span>}
          </div>
        </div>
        {isExpanded && (
          <div className="px-3 pb-3 pt-1 border-t border-zinc-700 bg-zinc-900/50">
            <pre className="text-xs text-zinc-300 bg-zinc-900 rounded p-3 whitespace-pre-wrap font-mono mb-3 max-h-64 overflow-auto">{getPromptDisplayContent(prompt.content)}</pre>
            {isStructuredPrompt(prompt.content) && (
              <div className="text-xs text-purple-400 mb-2 flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-purple-500/20 rounded">Structured Prompt</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1 mb-3">
              {prompt.tags.map(tag => <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-700 rounded">{tag}</span>)}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); copyPrompt(prompt.content, prompt.id); }}
                className={`flex-1 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors ${copiedId === prompt.id ? 'bg-green-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
              >
                {copiedId === prompt.id ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Prompt</>}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setMovingPrompt(prompt); }} className="p-2 hover:bg-zinc-700 rounded" title="Move to folder"><Move size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); setEditingPrompt(prompt); }} className="p-2 hover:bg-zinc-700 rounded" title="Edit"><Edit2 size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); deletePrompt(prompt.id); }} className="p-2 hover:bg-zinc-700 rounded text-red-400" title="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const FolderAccordion = ({ parentId = null, depth = 0 }) => {
    const folders = getSortedChildFolders(parentId).filter(f => !searchQuery && selectedTags.length === 0 || folderHasMatchingContent(f.id));

    return folders.map(folder => {
      const prompts = getFilteredPrompts(folder.id);
      const totalPrompts = getTotalPromptsInFolder(folder.id);
      const totalSubfolders = getTotalSubfoldersInFolder(folder.id);
      const isExpanded = expandedFolders.has(folder.id);
      const hasChildren = getChildFolders(folder.id).length > 0 || prompts.length > 0;

      return (
        <div key={folder.id} style={{ marginLeft: depth > 0 ? '16px' : '0' }}>
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, folderId: folder.id, folderName: folder.name });
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors group cursor-pointer"
            onClick={() => toggleFolder(folder.id)}
          >
            <button className="p-0.5">
              {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4" />}
            </button>
            <Folder size={16} className="text-yellow-500" />
            {editingFolder === folder.id ? (
              <input
                autoFocus
                defaultValue={folder.name}
                className="bg-zinc-800 border border-zinc-600 px-2 py-0.5 rounded text-sm flex-1"
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => updateFolder(folder.id, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') updateFolder(folder.id, e.target.value); }}
              />
            ) : (
              <span className="flex-1 font-medium text-sm">{folder.name}</span>
            )}
            <span className="text-xs text-zinc-500" title={`${totalPrompts} total prompts${totalSubfolders > 0 ? `, ${totalSubfolders} subfolders` : ''}`}>
              {totalPrompts}{totalSubfolders > 0 && <span className="text-zinc-600 ml-1">({totalSubfolders})</span>}
            </span>
            <div className="hidden group-hover:flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); setNewPromptFolder(folder.id); setShowNewPrompt(true); }} className="p-1 hover:bg-zinc-600 rounded" title="Add prompt"><Plus size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); setNewFolderParent(folder.id); setShowNewFolder(true); }} className="p-1 hover:bg-zinc-600 rounded" title="Add subfolder"><FolderPlus size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); setEditingFolder(folder.id); }} className="p-1 hover:bg-zinc-600 rounded"><Edit2 size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="p-1 hover:bg-zinc-600 rounded text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>

          {isExpanded && (
            <div className="ml-6 mt-1 space-y-1">
              <div className="flex items-center justify-end gap-2 mb-1">
                {hasDuplicateSubfolders(folder.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openMergeDuplicates(folder.id); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-orange-400 hover:text-orange-300 hover:bg-zinc-700 rounded transition-colors"
                    title="Merge duplicate subfolders"
                  >
                    <GitMerge size={14} /> Merge duplicates
                  </button>
                )}
                {hasDuplicatePrompts(folder.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openDuplicatePrompts(folder.id); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-700 rounded transition-colors"
                    title="Remove duplicate prompts"
                  >
                    <Copy size={14} /> Remove duplicates
                  </button>
                )}
                {prompts.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAllPromptsInFolder(folder.id); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                    title={areAllPromptsExpanded(folder.id) ? 'Collapse all prompts' : 'Expand all prompts'}
                  >
                    {areAllPromptsExpanded(folder.id) ? (
                      <><ChevronsDownUp size={14} /> Collapse all</>
                    ) : (
                      <><ChevronsUpDown size={14} /> Expand all</>
                    )}
                  </button>
                )}
              </div>
              {prompts.map(prompt => (
                <PromptAccordion key={prompt.id} prompt={prompt} />
              ))}
              <FolderAccordion parentId={folder.id} depth={depth + 1} />
            </div>
          )}
        </div>
      );
    });
  };

  // Grid view component for folders
  const FolderGrid = () => {
    const rootFolders = getSortedChildFolders(null).filter(f => !searchQuery && selectedTags.length === 0 || folderHasMatchingContent(f.id));

    const FolderCard = ({ folder, depth = 0 }) => {
      const prompts = getFilteredPrompts(folder.id);
      const childFolders = getSortedChildFolders(folder.id).filter(f => !searchQuery && selectedTags.length === 0 || folderHasMatchingContent(f.id));
      const isExpanded = expandedFolders.has(folder.id);
      const totalPrompts = getTotalPromptsInFolder(folder.id);
      const totalSubfolders = getTotalSubfoldersInFolder(folder.id);

      return (
        <div
          className={`bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-600 transition-colors ${depth === 0 ? '' : 'mt-2'}`}
        >
          <div
            onClick={() => toggleFolder(folder.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, folderId: folder.id, folderName: folder.name });
            }}
            className="p-4 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Folder size={20} className="text-yellow-500" />
                {editingFolder === folder.id ? (
                  <input
                    autoFocus
                    defaultValue={folder.name}
                    className="bg-zinc-900 border border-zinc-600 px-2 py-0.5 rounded text-sm"
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => updateFolder(folder.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') updateFolder(folder.id, e.target.value); }}
                  />
                ) : (
                  <span className="font-medium">{folder.name}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {gridEditMode && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setNewPromptFolder(folder.id); setShowNewPrompt(true); }} className="p-1.5 hover:bg-zinc-600 rounded text-zinc-400 hover:text-white" title="Add prompt"><Plus size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setNewFolderParent(folder.id); setShowNewFolder(true); }} className="p-1.5 hover:bg-zinc-600 rounded text-zinc-400 hover:text-white" title="Add subfolder"><FolderPlus size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingFolder(folder.id); }} className="p-1.5 hover:bg-zinc-600 rounded text-zinc-400 hover:text-white" title="Rename"><Edit2 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="p-1.5 hover:bg-zinc-600 rounded text-red-400" title="Delete"><Trash2 size={14} /></button>
                  </>
                )}
                {isExpanded ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span title={`${totalPrompts} total prompts (${prompts.length} direct)`}>
                {totalPrompts} prompt{totalPrompts !== 1 ? 's' : ''}{totalPrompts !== prompts.length && <span className="text-zinc-600"> ({prompts.length})</span>}
              </span>
              {totalSubfolders > 0 && <span title={`${totalSubfolders} total subfolders (${childFolders.length} direct)`}>
                {totalSubfolders} subfolder{totalSubfolders !== 1 ? 's' : ''}{totalSubfolders !== childFolders.length && <span className="text-zinc-600"> ({childFolders.length})</span>}
              </span>}
            </div>
          </div>

          {isExpanded && (
            <div className="border-t border-zinc-700 p-3 bg-zinc-900/50">
              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 mb-2">
                {hasDuplicateSubfolders(folder.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openMergeDuplicates(folder.id); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-orange-400 hover:text-orange-300 hover:bg-zinc-700 rounded transition-colors"
                    title="Merge duplicate subfolders"
                  >
                    <GitMerge size={14} /> Merge duplicates
                  </button>
                )}
                {hasDuplicatePrompts(folder.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openDuplicatePrompts(folder.id); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-700 rounded transition-colors"
                    title="Remove duplicate prompts"
                  >
                    <Copy size={14} /> Remove duplicates
                  </button>
                )}
                {prompts.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAllPromptsInFolder(folder.id); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                    title={areAllPromptsExpanded(folder.id) ? 'Collapse all prompts' : 'Expand all prompts'}
                  >
                    {areAllPromptsExpanded(folder.id) ? (
                      <><ChevronsDownUp size={14} /> Collapse all</>
                    ) : (
                      <><ChevronsUpDown size={14} /> Expand all</>
                    )}
                  </button>
                )}
              </div>
              {/* Prompts in this folder */}
              {prompts.length > 0 && (
                <div className="mb-3">
                  <div className="space-y-2">
                    {prompts.map(prompt => (
                      <PromptAccordion key={prompt.id} prompt={prompt} />
                    ))}
                  </div>
                </div>
              )}
              {/* Subfolders */}
              {childFolders.length > 0 && (
                <div className="space-y-2">
                  {childFolders.map(cf => (
                    <FolderCard key={cf.id} folder={cf} depth={depth + 1} />
                  ))}
                </div>
              )}
              {prompts.length === 0 && childFolders.length === 0 && (
                <div className="text-center text-zinc-500 text-sm py-4">
                  <p>Empty folder</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setNewPromptFolder(folder.id); setShowNewPrompt(true); }}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Add a prompt
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="grid grid-cols-3 gap-4">
        {rootFolders.map(folder => (
          <FolderCard key={folder.id} folder={folder} />
        ))}
      </div>
    );
  };

  const getInheritedTags = (folderId) => {
    if (!folderId) return [];
    const folderPrompts = data.prompts.filter(p => p.folderId === folderId);
    if (folderPrompts.length > 0) {
      return [...folderPrompts[folderPrompts.length - 1].tags];
    }
    return [];
  };

  const getFolderPath = (folderId) => {
    const path = [];
    let currentId = folderId;
    while (currentId) {
      const folder = data.folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder.name);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path.join(' / ');
  };

  const getFolderDepth = (folderId) => {
    let depth = 0;
    let currentId = folderId;
    while (currentId) {
      const folder = data.folders.find(f => f.id === currentId);
      if (folder && folder.parentId) {
        depth++;
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return depth;
  };

  const getSortedFoldersHierarchically = () => {
    const result = [];
    const addFolderAndChildren = (parentId, depth) => {
      const children = data.folders.filter(f => f.parentId === parentId);
      children.forEach(folder => {
        result.push({ ...folder, depth });
        addFolderAndChildren(folder.id, depth + 1);
      });
    };
    addFolderAndChildren(null, 0);
    return result;
  };

  const PromptModal = ({
    prompt,
    onSave,
    onClose,
    defaultFolderId,
    newlyCreatedFolderId,
    onConsumeNewlyCreatedFolder,
    onOpenNewRootFolder,
    onOpenNewSubfolder,
  }) => {
    const initialTags = prompt ? prompt.tags : getInheritedTags(defaultFolderId);

    // Parse structured data from content if it exists
    const parseStructuredContent = (content) => {
      try {
        const parsed = JSON.parse(content);
        if (parsed._structured) {
          return parsed;
        }
      } catch {}
      return null;
    };

    const existingStructured = prompt ? parseStructuredContent(prompt.content) : null;

    const [form, setForm] = useState(prompt || { title: '', content: '', folderId: defaultFolderId || data.folders[0]?.id, tags: initialTags });
    const [tagInput, setTagInput] = useState('');
    const [promptMode, setPromptMode] = useState(existingStructured ? 'structured' : 'freeform');
    const [structuredFields, setStructuredFields] = useState(existingStructured || {
      _structured: true,
      roleDetails: '',
      objective: '',
      tasks: '',
      successCriteria: '',
      constraints: '',
      outputRequirements: ''
    });

    // Generate combined prompt from structured fields
    const generateCombinedPrompt = () => {
      const sections = [];

      if (structuredFields.roleDetails?.trim()) {
        sections.push(`## Role\n${structuredFields.roleDetails.trim()}`);
      }
      if (structuredFields.objective?.trim()) {
        sections.push(`## Objective\n${structuredFields.objective.trim()}`);
      }
      if (structuredFields.tasks?.trim()) {
        sections.push(`## Tasks\n${structuredFields.tasks.trim()}`);
      }
      if (structuredFields.successCriteria?.trim()) {
        sections.push(`## Success Criteria\n${structuredFields.successCriteria.trim()}`);
      }
      if (structuredFields.constraints?.trim()) {
        sections.push(`## Constraints\n${structuredFields.constraints.trim()}`);
      }
      if (structuredFields.outputRequirements?.trim()) {
        sections.push(`## Output Requirements\n${structuredFields.outputRequirements.trim()}`);
      }

      return sections.join('\n\n');
    };

    const handleSave = () => {
      if (promptMode === 'structured') {
        // Store structured data as JSON so we can parse it later for editing
        const structuredContent = JSON.stringify(structuredFields);
        onSave({ ...form, content: structuredContent });
      } else {
        onSave(form);
      }
    };

    const handleFolderChange = (newFolderId) => {
      if (!prompt) {
        setForm(f => ({ ...f, folderId: newFolderId, tags: getInheritedTags(newFolderId) }));
      } else {
        setForm(f => ({ ...f, folderId: newFolderId }));
      }
    };

    useEffect(() => {
      if (!newlyCreatedFolderId) return;
      if (!prompt) {
        setForm((f) => ({
          ...f,
          folderId: newlyCreatedFolderId,
          tags: getInheritedTags(newlyCreatedFolderId),
        }));
      } else {
        setForm((f) => ({ ...f, folderId: newlyCreatedFolderId }));
      }
      onConsumeNewlyCreatedFolder?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot sync when a folder is created from the nested modal
    }, [newlyCreatedFolderId]);

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between p-4 border-b border-zinc-700">
            <h2 className="font-semibold">{prompt ? 'Edit Prompt' : 'New Prompt'}</h2>
            <button onClick={onClose} className="p-1 hover:bg-zinc-700 rounded"><X size={18} /></button>
          </div>
          <div className="p-4 space-y-4">
            {/* Prompt Mode Toggle */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Prompt Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPromptMode('freeform')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    promptMode === 'freeform'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  Freeform
                </button>
                <button
                  onClick={() => setPromptMode('structured')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    promptMode === 'structured'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  Structured
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {promptMode === 'freeform'
                  ? 'Write your prompt freely in any format'
                  : 'Fill out structured fields to generate a well-organized prompt'}
              </p>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-zinc-900 rounded px-3 py-2 text-sm" placeholder="Prompt title..." />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Folder</label>
              <FolderPathSelector
                selectedFolderId={form.folderId}
                onSelect={(id) => handleFolderChange(id)}
                folders={data.folders}
                firstOptionLabel="Select a folder..."
                subfolderOptionLabel="Select a subfolder..."
                summaryPrefix="Prompt will be saved in:"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onOpenNewRootFolder?.()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded"
                >
                  <FolderPlus size={14} /> New folder
                </button>
                <button
                  type="button"
                  disabled={!form.folderId}
                  title={!form.folderId ? 'Select a folder first' : 'Create a subfolder inside the selected folder'}
                  onClick={() => form.folderId && onOpenNewSubfolder?.(form.folderId)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-700"
                >
                  <FolderPlus size={14} /> New subfolder
                </button>
              </div>
            </div>

            {/* Freeform Mode - Single Content Field */}
            {promptMode === 'freeform' && (
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Prompt Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="w-full bg-zinc-900 rounded px-3 py-2 text-sm font-mono" placeholder="Enter your prompt..." />
              </div>
            )}

            {/* Structured Mode - Multiple Fields */}
            {promptMode === 'structured' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Role Details</label>
                  <textarea
                    value={structuredFields.roleDetails}
                    onChange={(e) => setStructuredFields({ ...structuredFields, roleDetails: e.target.value })}
                    rows={3}
                    className="w-full bg-zinc-900 rounded px-3 py-2 text-sm"
                    placeholder="Define the role or persona the AI should adopt (e.g., 'You are an expert software architect with 20 years of experience...')"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Objective</label>
                  <textarea
                    value={structuredFields.objective}
                    onChange={(e) => setStructuredFields({ ...structuredFields, objective: e.target.value })}
                    rows={2}
                    className="w-full bg-zinc-900 rounded px-3 py-2 text-sm"
                    placeholder="What is the main goal or purpose of this prompt?"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Tasks</label>
                  <textarea
                    value={structuredFields.tasks}
                    onChange={(e) => setStructuredFields({ ...structuredFields, tasks: e.target.value })}
                    rows={4}
                    className="w-full bg-zinc-900 rounded px-3 py-2 text-sm"
                    placeholder="List the specific tasks or steps to complete (one per line):&#10;1. Analyze the requirements&#10;2. Propose solutions&#10;3. Review and refine"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Success Criteria</label>
                  <textarea
                    value={structuredFields.successCriteria}
                    onChange={(e) => setStructuredFields({ ...structuredFields, successCriteria: e.target.value })}
                    rows={2}
                    className="w-full bg-zinc-900 rounded px-3 py-2 text-sm"
                    placeholder="How will success be measured? What defines a good output?"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Constraints</label>
                  <textarea
                    value={structuredFields.constraints}
                    onChange={(e) => setStructuredFields({ ...structuredFields, constraints: e.target.value })}
                    rows={2}
                    className="w-full bg-zinc-900 rounded px-3 py-2 text-sm"
                    placeholder="Any limitations, restrictions, or things to avoid?"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Output Requirements</label>
                  <textarea
                    value={structuredFields.outputRequirements}
                    onChange={(e) => setStructuredFields({ ...structuredFields, outputRequirements: e.target.value })}
                    rows={2}
                    className="w-full bg-zinc-900 rounded px-3 py-2 text-sm"
                    placeholder="Specify the desired format, length, or structure of the output"
                  />
                </div>

                {/* Preview of combined prompt */}
                {(structuredFields.roleDetails || structuredFields.objective || structuredFields.tasks ||
                  structuredFields.successCriteria || structuredFields.constraints || structuredFields.outputRequirements) && (
                  <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-zinc-400">Preview (Combined Prompt)</label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generateCombinedPrompt());
                          showNotif('Prompt copied to clipboard');
                        }}
                        className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center gap-1"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono max-h-48 overflow-auto">
                      {generateCombinedPrompt()}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map(tag => (
                  <span key={tag} className="bg-zinc-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                    {tag}
                    <button onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })} className="hover:text-red-400"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    setForm({ ...form, tags: [...new Set([...form.tags, tagInput.trim().toLowerCase()])] });
                    setTagInput('');
                  }
                }} className="flex-1 bg-zinc-900 rounded px-3 py-2 text-sm" placeholder="Add tag and press Enter..." />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(data.tagCategories || []).map(category => {
                  const availableTags = category.tags.filter(t => data.tags.includes(t) && !form.tags.includes(t));
                  if (availableTags.length === 0) return null;
                  return (
                    <div key={category.id} className="w-full mb-2">
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">{category.name}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {availableTags.map(tag => (
                          <button key={tag} onClick={() => setForm({ ...form, tags: [...form.tags, tag] })} className="text-xs px-2 py-1 bg-zinc-900 hover:bg-zinc-700 rounded">{tag}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {getUncategorizedTags().filter(t => !form.tags.includes(t)).length > 0 && (
                  <div className="w-full">
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Other:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getUncategorizedTags().filter(t => !form.tags.includes(t)).slice(0, 10).map(tag => (
                        <button key={tag} onClick={() => setForm({ ...form, tags: [...form.tags, tag] })} className="text-xs px-2 py-1 bg-zinc-900 hover:bg-zinc-700 rounded">{tag}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
            <button onClick={onClose} className="px-4 py-2 text-sm hover:bg-zinc-700 rounded">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"><Save size={14} /> Save</button>
          </div>
        </div>
      </div>
    );
  };

  const rootPrompts = getFilteredPrompts(null);

  // Get current notebook
  const currentNotebook = notebooks.find(n => n.id === activeNotebook);
  const isPromptsNotebook = currentNotebook?.type === 'prompts';

  // Spreadsheet Editor Component
  const SpreadsheetEditor = ({ note, isEditing, onUpdate }) => {
    // Default table structure
    const createDefaultTable = (name = 'Table 1') => ({
      name,
      columns: ['Column A', 'Column B', 'Column C'],
      columnWidths: [150, 150, 150],
      columnTypes: [{ type: 'text' }, { type: 'text' }, { type: 'text' }],
      rows: [['', '', ''], ['', '', ''], ['', '', '']]
    });

    // Parse spreadsheet data from note content (supports legacy and new format)
    const parseSpreadsheetData = (content) => {
      try {
        const parsed = JSON.parse(content);
        // Check if it's the new multi-table format
        if (parsed.tables && Array.isArray(parsed.tables)) {
          // Migrate tables to ensure they have all required fields
          return {
            tables: parsed.tables.map((table, idx) => ({
              name: table.name || `Table ${idx + 1}`,
              columns: table.columns || ['Column A', 'Column B', 'Column C'],
              columnWidths: table.columnWidths || table.columns?.map(() => 150) || [150, 150, 150],
              columnTypes: table.columnTypes || table.columns?.map(() => ({ type: 'text' })) || [{ type: 'text' }, { type: 'text' }, { type: 'text' }],
              rows: table.rows || [['', '', '']]
            })),
            activeTableIndex: parsed.activeTableIndex || 0
          };
        }
        // Legacy format: single table with columns/rows
        return {
          tables: [{
            name: 'Table 1',
            columns: parsed.columns || ['Column A', 'Column B', 'Column C'],
            columnWidths: parsed.columnWidths || parsed.columns?.map(() => 150) || [150, 150, 150],
            columnTypes: parsed.columnTypes || parsed.columns?.map(() => ({ type: 'text' })) || [{ type: 'text' }, { type: 'text' }, { type: 'text' }],
            rows: parsed.rows || [['', '', '']]
          }],
          activeTableIndex: 0
        };
      } catch {
        return { tables: [createDefaultTable()], activeTableIndex: 0 };
      }
    };

    const [spreadsheetData, setSpreadsheetData] = useState(() => parseSpreadsheetData(note.content));
    const [resizingColumn, setResizingColumn] = useState(null);
    const [columnTypeMenu, setColumnTypeMenu] = useState(null); // { tableIndex, colIndex }
    const [dropdownOptionsEdit, setDropdownOptionsEdit] = useState(null); // { tableIndex, colIndex, options }
    const resizeStartX = useRef(0);
    const resizeStartWidth = useRef(0);

    // Get current active table
    const activeTable = spreadsheetData.tables[spreadsheetData.activeTableIndex] || spreadsheetData.tables[0];

    // Update parent when data changes
    const updateSpreadsheet = (newData) => {
      setSpreadsheetData(newData);
      if (onUpdate) {
        onUpdate(JSON.stringify(newData));
      }
    };

    // Update a specific table
    const updateTable = (tableIndex, tableData) => {
      const newTables = [...spreadsheetData.tables];
      newTables[tableIndex] = { ...newTables[tableIndex], ...tableData };
      updateSpreadsheet({ ...spreadsheetData, tables: newTables });
    };

    const updateCell = (rowIndex, colIndex, value) => {
      const tableIndex = spreadsheetData.activeTableIndex;
      const table = spreadsheetData.tables[tableIndex];
      const newRows = [...table.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];
      newRows[rowIndex][colIndex] = value;
      updateTable(tableIndex, { rows: newRows });
    };

    const updateColumnHeader = (colIndex, value) => {
      const tableIndex = spreadsheetData.activeTableIndex;
      const table = spreadsheetData.tables[tableIndex];
      const newColumns = [...table.columns];
      newColumns[colIndex] = value;
      updateTable(tableIndex, { columns: newColumns });
    };

    const addRow = () => {
      const tableIndex = spreadsheetData.activeTableIndex;
      const table = spreadsheetData.tables[tableIndex];
      const newRow = table.columns.map(() => '');
      updateTable(tableIndex, { rows: [...table.rows, newRow] });
    };

    const removeRow = (rowIndex) => {
      const tableIndex = spreadsheetData.activeTableIndex;
      const table = spreadsheetData.tables[tableIndex];
      if (table.rows.length <= 1) return;
      const newRows = table.rows.filter((_, i) => i !== rowIndex);
      updateTable(tableIndex, { rows: newRows });
    };

    const addColumn = () => {
      const tableIndex = spreadsheetData.activeTableIndex;
      const table = spreadsheetData.tables[tableIndex];
      const newColumns = [...table.columns, `Column ${String.fromCharCode(65 + table.columns.length)}`];
      const newColumnWidths = [...table.columnWidths, 150];
      const newColumnTypes = [...table.columnTypes, { type: 'text' }];
      const newRows = table.rows.map(row => [...row, '']);
      updateTable(tableIndex, { columns: newColumns, columnWidths: newColumnWidths, columnTypes: newColumnTypes, rows: newRows });
    };

    const removeColumn = (colIndex) => {
      const tableIndex = spreadsheetData.activeTableIndex;
      const table = spreadsheetData.tables[tableIndex];
      if (table.columns.length <= 1) return;
      const newColumns = table.columns.filter((_, i) => i !== colIndex);
      const newColumnWidths = table.columnWidths.filter((_, i) => i !== colIndex);
      const newColumnTypes = table.columnTypes.filter((_, i) => i !== colIndex);
      const newRows = table.rows.map(row => row.filter((_, i) => i !== colIndex));
      updateTable(tableIndex, { columns: newColumns, columnWidths: newColumnWidths, columnTypes: newColumnTypes, rows: newRows });
    };

    // Column width resizing
    const handleResizeStart = (e, colIndex) => {
      e.preventDefault();
      setResizingColumn(colIndex);
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = activeTable.columnWidths[colIndex];
    };

    useEffect(() => {
      if (resizingColumn === null) return;

      const handleMouseMove = (e) => {
        const diff = e.clientX - resizeStartX.current;
        const newWidth = Math.max(80, resizeStartWidth.current + diff);
        const tableIndex = spreadsheetData.activeTableIndex;
        const table = spreadsheetData.tables[tableIndex];
        const newColumnWidths = [...table.columnWidths];
        newColumnWidths[resizingColumn] = newWidth;
        updateTable(tableIndex, { columnWidths: newColumnWidths });
      };

      const handleMouseUp = () => {
        setResizingColumn(null);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [resizingColumn, spreadsheetData.activeTableIndex]);

    // Unique non-empty cell values in column order, for seeding dropdown options
    const getUniqueColumnCellValues = (table, colIndex) => {
      const seen = new Set();
      const ordered = [];
      for (const row of table.rows) {
        const raw = row[colIndex];
        const v = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
        if (!v || seen.has(v)) continue;
        seen.add(v);
        ordered.push(v);
      }
      return ordered;
    };

    const mergeDropdownOptionsFromColumn = (table, colIndex, savedOptions = []) => {
      const fromCells = getUniqueColumnCellValues(table, colIndex);
      const seen = new Set(fromCells);
      const merged = [...fromCells];
      for (const opt of savedOptions) {
        const v = typeof opt === 'string' ? opt.trim() : String(opt ?? '').trim();
        if (!v || seen.has(v)) continue;
        seen.add(v);
        merged.push(v);
      }
      return merged;
    };

    // Column type management
    const updateColumnType = (colIndex, newType, options = null) => {
      const tableIndex = spreadsheetData.activeTableIndex;
      const table = spreadsheetData.tables[tableIndex];
      const newColumnTypes = [...table.columnTypes];
      newColumnTypes[colIndex] = { type: newType, ...(options ? { options } : {}) };
      updateTable(tableIndex, { columnTypes: newColumnTypes });
      setColumnTypeMenu(null);
    };

    // Multiple tables management
    const addTable = () => {
      const newTable = createDefaultTable(`Table ${spreadsheetData.tables.length + 1}`);
      updateSpreadsheet({
        tables: [...spreadsheetData.tables, newTable],
        activeTableIndex: spreadsheetData.tables.length
      });
    };

    const removeTable = (tableIndex) => {
      if (spreadsheetData.tables.length <= 1) return;
      const newTables = spreadsheetData.tables.filter((_, i) => i !== tableIndex);
      const newActiveIndex = tableIndex >= newTables.length ? newTables.length - 1 : tableIndex;
      updateSpreadsheet({ tables: newTables, activeTableIndex: newActiveIndex });
    };

    const renameTable = (tableIndex, newName) => {
      const newTables = [...spreadsheetData.tables];
      newTables[tableIndex] = { ...newTables[tableIndex], name: newName };
      updateSpreadsheet({ ...spreadsheetData, tables: newTables });
    };

    const switchTable = (tableIndex) => {
      updateSpreadsheet({ ...spreadsheetData, activeTableIndex: tableIndex });
    };

    // Render cell input based on column type
    const renderCellInput = (cell, rowIndex, colIndex) => {
      const columnType = activeTable.columnTypes[colIndex] || { type: 'text' };

      switch (columnType.type) {
        case 'date':
          return (
            <input
              type="date"
              value={cell}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
              className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none focus:bg-zinc-700"
            />
          );
        case 'time':
          return (
            <input
              type="time"
              value={cell}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
              className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none focus:bg-zinc-700"
            />
          );
        case 'datetime':
          return (
            <input
              type="datetime-local"
              value={cell}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
              className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none focus:bg-zinc-700"
            />
          );
        case 'dropdown':
          return (
            <select
              value={cell}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
              className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none focus:bg-zinc-700 cursor-pointer"
            >
              <option value="">Select...</option>
              {(columnType.options || []).map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          );
        default:
          return (
            <input
              type="text"
              value={cell}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
              className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none focus:bg-zinc-700"
              placeholder=""
            />
          );
      }
    };

    // Column type icon
    const getColumnTypeIcon = (type) => {
      switch (type) {
        case 'date': return <Calendar size={12} />;
        case 'time': return <Clock size={12} />;
        case 'datetime': return <Calendar size={12} />;
        case 'dropdown': return <ChevronDown size={12} />;
        default: return <Type size={12} />;
      }
    };

    // File upload ref
    const fileInputRef = useRef(null);

    // Handle file upload (CSV and Excel) - updates the active table
    const handleFileUpload = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      const fileName = file.name.toLowerCase();
      const tableIndex = spreadsheetData.activeTableIndex;

      if (fileName.endsWith('.csv')) {
        // Parse CSV
        reader.onload = (e) => {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length > 0) {
              // First line is headers
              const headers = parseCSVLine(lines[0]);
              const rows = lines.slice(1).map(line => {
                const cells = parseCSVLine(line);
                // Ensure each row has the same number of columns as headers
                while (cells.length < headers.length) cells.push('');
                return cells.slice(0, headers.length);
              });
              updateTable(tableIndex, {
                columns: headers,
                columnWidths: headers.map(() => 150),
                columnTypes: headers.map(() => ({ type: 'text' })),
                rows: rows.length > 0 ? rows : [[]]
              });
            }
          }
        };
        reader.readAsText(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel
        reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length > 0) {
            const headers = (jsonData[0] || []).map(h => String(h || ''));
            const rows = jsonData.slice(1).map(row => {
              const cells = (row || []).map(cell => String(cell || ''));
              // Ensure each row has the same number of columns as headers
              while (cells.length < headers.length) cells.push('');
              return cells.slice(0, headers.length);
            });
            updateTable(tableIndex, {
              columns: headers.length > 0 ? headers : ['Column A'],
              columnWidths: (headers.length > 0 ? headers : ['Column A']).map(() => 150),
              columnTypes: (headers.length > 0 ? headers : ['Column A']).map(() => ({ type: 'text' })),
              rows: rows.length > 0 ? rows : [['']]
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      }

      // Reset input so same file can be uploaded again
      event.target.value = '';
    };

    // Parse CSV line handling quoted values
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    return (
      <div className="h-full flex flex-col min-h-0">
        {/* Table Tabs */}
        <div className="flex items-center gap-1 mb-2 flex-shrink-0 border-b border-zinc-700 pb-2">
          {spreadsheetData.tables.map((table, tableIndex) => (
            <div
              key={tableIndex}
              className={`group flex items-center gap-1 px-3 py-1.5 rounded-t text-sm cursor-pointer ${
                tableIndex === spreadsheetData.activeTableIndex
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50'
              }`}
              onClick={() => switchTable(tableIndex)}
            >
              <input
                type="text"
                value={table.name}
                onChange={(e) => {
                  e.stopPropagation();
                  renameTable(tableIndex, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent w-20 text-sm focus:outline-none focus:bg-zinc-600 rounded px-1"
              />
              {spreadsheetData.tables.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTable(tableIndex);
                  }}
                  className="p-0.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  title="Delete table"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTable}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
            title="Add new table"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap flex-shrink-0">
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded"
          >
            <Plus size={14} /> Add Row
          </button>
          <button
            onClick={addColumn}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded"
          >
            <Plus size={14} /> Add Column
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded"
          >
            <Upload size={14} /> Import Spreadsheet
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-xs text-zinc-500 ml-2">
            {activeTable.rows.length} rows × {activeTable.columns.length} columns
          </span>
        </div>

        {/* Table */}
        <div
          className="flex-1 border border-zinc-700 rounded spreadsheet-scroll"
          style={{ maxHeight: 'calc(100vh - 320px)' }}
        >
          <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-10 bg-zinc-800 border border-zinc-700 p-2 text-xs text-zinc-500 sticky left-0 z-20">#</th>
                {activeTable.columns.map((col, colIndex) => (
                  <th
                    key={colIndex}
                    className="bg-zinc-800 border border-zinc-700 p-0 relative"
                    style={{ width: `${activeTable.columnWidths[colIndex]}px`, minWidth: `${activeTable.columnWidths[colIndex]}px` }}
                  >
                    <div className="flex items-center">
                      {/* Column type button */}
                      <div className="relative">
                        <button
                          onClick={() => setColumnTypeMenu(
                            columnTypeMenu?.colIndex === colIndex ? null : { tableIndex: spreadsheetData.activeTableIndex, colIndex }
                          )}
                          className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700"
                          title="Change column type"
                        >
                          {getColumnTypeIcon(activeTable.columnTypes[colIndex]?.type || 'text')}
                        </button>
                        {/* Column type dropdown */}
                        {columnTypeMenu?.colIndex === colIndex && (
                          <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-30 min-w-[160px]">
                            <button
                              onClick={() => updateColumnType(colIndex, 'text')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
                            >
                              <Type size={14} /> Text
                            </button>
                            <button
                              onClick={() => updateColumnType(colIndex, 'date')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
                            >
                              <Calendar size={14} /> Date
                            </button>
                            <button
                              onClick={() => updateColumnType(colIndex, 'time')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
                            >
                              <Clock size={14} /> Time
                            </button>
                            <button
                              onClick={() => updateColumnType(colIndex, 'datetime')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
                            >
                              <Calendar size={14} /> Date & Time
                            </button>
                            <button
                              onClick={() => {
                                const saved = activeTable.columnTypes[colIndex]?.options || [];
                                setDropdownOptionsEdit({
                                  tableIndex: spreadsheetData.activeTableIndex,
                                  colIndex,
                                  options: mergeDropdownOptionsFromColumn(activeTable, colIndex, saved)
                                });
                                setColumnTypeMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 text-left"
                            >
                              <ChevronDown size={14} /> Dropdown
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => updateColumnHeader(colIndex, e.target.value)}
                        className="flex-1 bg-transparent px-2 py-2 text-sm font-medium text-center focus:outline-none focus:bg-zinc-700 min-w-0"
                      />
                      {activeTable.columns.length > 1 && (
                        <button
                          onClick={() => removeColumn(colIndex)}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-700"
                          title="Remove column"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    {/* Resize handle */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500/50 z-10"
                      onMouseDown={(e) => handleResizeStart(e, colIndex)}
                    />
                  </th>
                ))}
                <th className="w-10 bg-zinc-800 border border-zinc-700"></th>
              </tr>
            </thead>
            <tbody>
              {activeTable.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="group">
                  <td className="bg-zinc-800 border border-zinc-700 p-2 text-xs text-zinc-500 text-center sticky left-0 z-10">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className="border border-zinc-700 p-0"
                      style={{ width: `${activeTable.columnWidths[colIndex]}px`, minWidth: `${activeTable.columnWidths[colIndex]}px` }}
                    >
                      {renderCellInput(cell, rowIndex, colIndex)}
                    </td>
                  ))}
                  <td className="border border-zinc-700 p-1 bg-zinc-800/50">
                    {activeTable.rows.length > 1 && (
                      <button
                        onClick={() => removeRow(rowIndex)}
                        className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove row"
                      >
                        <Minus size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dropdown options editor modal */}
        {dropdownOptionsEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDropdownOptionsEdit(null)}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-medium mb-3">Configure Dropdown Options</h3>
              <p className="text-xs text-zinc-400 mb-3">Enter each option on a new line:</p>
              <textarea
                value={dropdownOptionsEdit.options.join('\n')}
                onChange={(e) => setDropdownOptionsEdit({
                  ...dropdownOptionsEdit,
                  options: e.target.value.split('\n').filter(o => o.trim())
                })}
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setDropdownOptionsEdit(null)}
                  className="px-3 py-1.5 text-sm hover:bg-zinc-700 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateColumnType(dropdownOptionsEdit.colIndex, 'dropdown', dropdownOptionsEdit.options);
                    setDropdownOptionsEdit(null);
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Notes View Component for generic notebooks
  const NotesView = () => {
    const notebookNotes = getNotesForNotebook(activeNotebook);
    const currentNote = notes.find(n => n.id === activeNote);

    return (
      <div className="flex h-full">
        {/* Notes Sidebar */}
        <div className={`${notesPanelOpen ? 'w-72' : 'w-12'} border-r border-zinc-800 flex flex-col bg-zinc-900/50 transition-all duration-300 flex-shrink-0`}>
          <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
            {notesPanelOpen ? (
              <>
                <span className="text-sm font-medium text-zinc-400 px-2">Notes ({notebookNotes.length})</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setShowNewNote(true); setNoteForm({ title: '', content: '', type: 'text', tags: [] }); }}
                    className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                    title="New note"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => setNotesPanelOpen(false)}
                    className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                    title="Collapse notes panel"
                  >
                    <PanelLeftClose size={16} />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setNotesPanelOpen(true)}
                className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white mx-auto"
                title="Expand notes panel"
              >
                <Menu size={16} />
              </button>
            )}
          </div>
          {notesPanelOpen && <div className="flex-1 overflow-auto">
            {notebookNotes.length === 0 ? (
              <div className="p-4 text-center text-zinc-500">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notes yet</p>
                <button
                  onClick={() => { setShowNewNote(true); setNoteForm({ title: '', content: '' }); }}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Create your first note
                </button>
              </div>
            ) : (
              <div className="py-2">
                {notebookNotes.map((note, index) => (
                  <div
                    key={note.id}
                    draggable
                    onDragStart={(e) => handleNoteDragStart(e, note)}
                    onDragEnd={handleNoteDragEnd}
                    onDragOver={(e) => handleNoteDragOver(e, index)}
                    onDrop={(e) => handleNoteListDrop(e, index)}
                    onClick={() => setActiveNote(note.id)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors cursor-grab active:cursor-grabbing ${
                      activeNote === note.id
                        ? 'bg-blue-600/20 border-l-2 border-l-blue-500'
                        : draggingNote?.id === note.id
                          ? 'opacity-50'
                          : dragOverNoteIndex === index && draggingNote
                            ? 'border-t-2 border-t-blue-500'
                            : 'hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical size={12} className="text-zinc-600 flex-shrink-0" />
                      {note.type === 'spreadsheet' ? (
                        <Table size={14} className="text-green-500 flex-shrink-0" />
                      ) : note.type === 'prompt' || note.template === 'prompt' ? (
                        <MessageSquare size={14} className="text-purple-500 flex-shrink-0" />
                      ) : (
                        <FileText size={14} className="text-blue-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm truncate">{note.title}</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 line-clamp-2 ml-8">
                      {note.type === 'spreadsheet' ? (
                        <span className="text-green-500/70">Spreadsheet</span>
                      ) : (
                        note.content || 'No content'
                      )}
                    </div>
                  </div>
                ))}
                {/* Drop zone at the end */}
                {draggingNote && (
                  <div
                    onDragOver={(e) => handleNoteDragOver(e, notebookNotes.length)}
                    onDrop={(e) => handleNoteListDrop(e, notebookNotes.length)}
                    className={`h-8 mx-2 rounded transition-colors ${
                      dragOverNoteIndex === notebookNotes.length ? 'bg-blue-500/20 border-2 border-dashed border-blue-500' : ''
                    }`}
                  />
                )}
              </div>
            )}
          </div>}
        </div>

        {/* Note Editor */}
        <div className="flex-1 flex flex-col">
          {currentNote ? (
            <>
              {/* Note Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {currentNote.type === 'spreadsheet' ? (
                    <Table size={20} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <FileText size={20} className="text-blue-500 flex-shrink-0" />
                  )}
                  {editingNoteId === currentNote.id ? (
                    <input
                      type="text"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                      className="flex-1 bg-zinc-800 rounded px-3 py-2 text-lg font-medium"
                      placeholder="Note title"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-lg font-medium truncate">{currentNote.title}</h2>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {currentNote.type !== 'spreadsheet' && (
                    <button
                      onClick={() => copyNoteContent(currentNote.content, currentNote.id)}
                      className={`p-2 rounded transition-colors ${
                        copiedNoteId === currentNote.id
                          ? 'bg-green-600 text-white'
                          : 'hover:bg-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                      title="Copy content"
                    >
                      {copiedNoteId === currentNote.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  )}
                  {editingNoteId === currentNote.id ? (
                    <>
                      <button
                        onClick={() => {
                          updateNote(currentNote.id, { title: noteForm.title, content: noteForm.content, tags: noteForm.tags });
                        }}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-1"
                      >
                        <Save size={14} /> Save
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {currentNote.type !== 'spreadsheet' && (
                        <button
                          onClick={() => {
                            setEditingNoteId(currentNote.id);
                            setNoteForm({ title: currentNote.title, content: currentNote.content, type: currentNote.type || 'text', tags: currentNote.tags || [] });
                          }}
                          className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                          title="Edit note"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => duplicateNoteToNotebook(currentNote.id)}
                        className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                        title="Duplicate note"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => { setMovingNoteId(currentNote.id); setShowMoveNote(true); }}
                        className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                        title="Move to another notebook"
                      >
                        <Move size={16} />
                      </button>
                      <button
                        onClick={() => deleteNote(currentNote.id)}
                        className="p-2 hover:bg-zinc-700 rounded text-red-400 hover:text-red-300"
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Note Content */}
              <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
                {currentNote.type === 'spreadsheet' ? (
                  <SpreadsheetEditor
                    note={currentNote}
                    isEditing={true}
                    onUpdate={(newContent) => {
                      updateNote(currentNote.id, { content: newContent });
                    }}
                  />
                ) : editingNoteId === currentNote.id ? (
                  <div className="flex flex-col h-full gap-4">
                    <textarea
                      value={noteForm.content}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      className="flex-1 bg-zinc-800 rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Write your note here..."
                    />
                    {/* Tags input for prompt-type notes */}
                    {(currentNote.type === 'prompt' || currentNote.template === 'prompt') && (
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-zinc-400">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(noteForm.tags || []).map(tag => (
                            <span key={tag} className="bg-purple-600/30 text-purple-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                              {tag}
                              <button
                                onClick={() => setNoteForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }))}
                                className="hover:text-red-400"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a tag and press Enter"
                            className="flex-1 bg-zinc-800 rounded px-3 py-2 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                const newTag = e.target.value.trim().toLowerCase();
                                if (!(noteForm.tags || []).includes(newTag)) {
                                  setNoteForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
                                }
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                        {/* Suggested tags from existing tags */}
                        {data.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs text-zinc-500">Suggestions:</span>
                            {data.tags.filter(t => !(noteForm.tags || []).includes(t)).slice(0, 8).map(tag => (
                              <button
                                key={tag}
                                onClick={() => setNoteForm(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }))}
                                className="text-xs px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-300 leading-relaxed">
                      {currentNote.content || <span className="text-zinc-500 italic">No content yet. Click edit to add content.</span>}
                    </pre>
                    {/* Display tags for prompt-type notes */}
                    {(currentNote.type === 'prompt' || currentNote.template === 'prompt') && currentNote.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                        {currentNote.tags.map(tag => (
                          <span key={tag} className="bg-purple-600/30 text-purple-300 px-2 py-1 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Note Footer */}
              <div className="px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500">
                {currentNote.type === 'spreadsheet' && <span className="text-green-500/70 mr-2">Spreadsheet</span>}
                Last updated: {new Date(currentNote.updatedAt).toLocaleString()}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a note or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex">
      {/* Sidebar Drawer */}
      <div className={`${drawerOpen ? 'w-64' : 'w-16'} bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          {drawerOpen ? (
            <>
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-blue-500" />
                <span className="font-semibold">Notebooks</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors mx-auto"
              title="Expand sidebar"
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* New Notebook Button */}
        <div className="px-3 py-2 border-b border-zinc-800">
          <button
            onClick={() => setShowNewNotebook(true)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ${!drawerOpen ? 'px-0' : ''}`}
            title="Create new notebook"
          >
            <Plus size={16} />
            {drawerOpen && <span>New Notebook</span>}
          </button>
        </div>

        {/* Notebooks List */}
        <div className="flex-1 overflow-auto py-2">
          {notebooks.map(notebook => (
            <button
              key={notebook.id}
              onClick={() => setActiveNotebook(notebook.id)}
              onDragOver={(e) => handleNotebookDragOver(e, notebook.id)}
              onDragLeave={handleNotebookDragLeave}
              onDrop={(e) => handleNotebookDrop(e, notebook.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeNotebook === notebook.id
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500'
                  : dragOverNotebook === notebook.id
                    ? 'bg-green-600/30 text-green-400 border-r-2 border-green-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
              title={notebook.name}
            >
              {notebook.type === 'prompts' ? (
                <FileText size={18} className={activeNotebook === notebook.id ? 'text-blue-400' : dragOverNotebook === notebook.id ? 'text-green-400' : ''} />
              ) : (
                <Notebook size={18} className={activeNotebook === notebook.id ? 'text-blue-400' : dragOverNotebook === notebook.id ? 'text-green-400' : ''} />
              )}
              {drawerOpen && <span className="truncate">{notebook.name}</span>}
            </button>
          ))}
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Check size={16} /> {notification}
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedPrompts.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-800 border-t border-zinc-700 px-6 py-3 shadow-lg">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedPrompts.size} prompt{selectedPrompts.size > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkMove(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  <Move size={14} /> Move to folder
                </button>
                <button
                  onClick={bulkDeletePrompts}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!drawerOpen && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors mr-2"
                  title="Expand sidebar"
                >
                  <Menu size={18} />
                </button>
              )}
              <h1 className="font-bold text-xl flex items-center gap-2">
                {isPromptsNotebook ? (
                  <FileText size={24} className="text-blue-500" />
                ) : (
                  <Notebook size={24} className="text-purple-500" />
                )}
                {notebooks.find(n => n.id === activeNotebook)?.name || 'Notebook'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {isPromptsNotebook ? (
                <>
                  <button onClick={exportData} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded" title="Download full backup"><Download size={14} /> Backup</button>
                  <button onClick={() => setShowBackupRestore(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded" title="Restore from backup"><Upload size={14} /> Restore</button>
                  <button onClick={openMergeDuplicates} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded" title="Merge duplicate folders"><GitMerge size={14} /> Merge Duplicates</button>
                </>
              ) : (
                <button
                  onClick={() => deleteNotebook(activeNotebook)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded"
                  title="Delete this notebook"
                >
                  <Trash2 size={14} /> Delete Notebook
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Toolbar - Only show for Prompts notebook */}
      {isPromptsNotebook && (
        <div className="border-b border-zinc-800 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-800 rounded-lg pl-10 pr-10 py-2 text-sm" placeholder="Search prompts..." />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={toggleAllFolders}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg"
              title={areAllFoldersExpanded() ? 'Collapse all folders' : 'Expand all folders'}
            >
              {areAllFoldersExpanded() ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
              {areAllFoldersExpanded() ? 'Collapse' : 'Expand'}
            </button>
            <div className="h-6 w-px bg-zinc-700" />
            <div className="flex items-center bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                title="List view"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            {viewMode === 'grid' && (
              <button
                onClick={() => setGridEditMode(!gridEditMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${gridEditMode ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                title="Toggle edit mode"
              >
                <Edit2 size={14} />
                <span>Edit</span>
              </button>
            )}
            <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
              <ArrowUpDown size={14} className="text-zinc-500" />
              <select
                value={folderSort}
                onChange={(e) => setFolderSort(e.target.value)}
                className="bg-transparent text-sm text-zinc-300 cursor-pointer focus:outline-none"
              >
                <option value="name" className="bg-zinc-800">Name</option>
                <option value="prompts" className="bg-zinc-800">Prompts</option>
                <option value="subfolders" className="bg-zinc-800">Subfolders</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tag Filter - Only show for Prompts notebook */}
      {isPromptsNotebook && showTagManager && (
        <div className="border-b border-zinc-800 px-6 py-3">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Filter by tags</span>
              <button onClick={() => setShowTagCategoryManager(true)} className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded">Manage Categories</button>
            </div>
            <div className="space-y-3">
              {(data.tagCategories || []).map(category => (
                <div key={category.id}>
                  <div className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wide">{category.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {category.tags.filter(tag => data.tags.includes(tag)).map(tag => (
                      <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} className={`px-2 py-1 rounded text-xs ${selectedTags.includes(tag) ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>{tag}</button>
                    ))}
                    {category.tags.filter(tag => data.tags.includes(tag)).length === 0 && (
                      <span className="text-xs text-zinc-600 italic">No tags in this category</span>
                    )}
                  </div>
                </div>
              ))}
              {getUncategorizedTags().length > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wide">Uncategorized</div>
                  <div className="flex flex-wrap gap-2">
                    {getUncategorizedTags().map(tag => (
                      <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} className={`px-2 py-1 rounded text-xs ${selectedTags.includes(tag) ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>{tag}</button>
                    ))}
                  </div>
                </div>
              )}
              {data.tags.length === 0 && (
                <span className="text-xs text-zinc-600 italic">No tags yet. Add tags when creating prompts.</span>
              )}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <button onClick={() => setSelectedTags([])} className="px-2 py-1 rounded text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300">Clear all filters</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {isPromptsNotebook ? (
        <div className="px-6 py-6 flex-1 overflow-auto">
          <div className={`max-w-5xl mx-auto ${viewMode === 'list' ? 'space-y-1' : ''}`}>
            {loading ? (
              <div className="text-center text-zinc-500 py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            ) : (
              <>
                {viewMode === 'list' ? <FolderAccordion /> : <FolderGrid />}
                {data.folders.length === 0 && (
                  <div className="text-center text-zinc-500 py-12">
                    <Folder size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No folders yet</p>
                    <button onClick={() => setShowNewFolder(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">Create your first folder</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <NotesView />
        </div>
      )}

      {/* Floating Action Button - shows different options based on note template */}
      {(() => {
        const currentNote = notes.find(n => n.id === activeNote);
        const noteTemplate = currentNote?.type || currentNote?.template;

        // Determine FAB visibility and options based on context
        // Text notes: no FAB
        // Prompt notes or prompts notebook: Bulk Import, New Folder, New Prompt
        // Spreadsheet notes: New Spreadsheet
        const isPromptContext = isPromptsNotebook || noteTemplate === 'prompt';
        const isSpreadsheetContext = noteTemplate === 'spreadsheet';
        const isTextContext = noteTemplate === 'text' && !isPromptsNotebook;

        // Hide FAB for text notes
        if (isTextContext) return null;

        return (
          <>
            <div className="fixed bottom-6 right-6 z-40">
              {showFabMenu && (
                <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-end mb-2">
                  {isPromptContext ? (
                    <>
                      <button
                        onClick={() => { setShowBulkImport(true); setShowFabMenu(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg text-sm whitespace-nowrap"
                      >
                        <Upload size={16} /> Bulk Import
                      </button>
                      <button
                        onClick={() => { setShowNewFolder(true); setNewFolderParent(null); setShowFabMenu(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg shadow-lg text-sm whitespace-nowrap"
                      >
                        <FolderPlus size={16} /> New Folder
                      </button>
                      <button
                        onClick={() => { setShowNewPrompt(true); setNewPromptFolder(null); setShowFabMenu(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-sm whitespace-nowrap"
                      >
                        <Plus size={16} /> New Prompt
                      </button>
                    </>
                  ) : isSpreadsheetContext ? (
                    <button
                      onClick={() => {
                        setShowNewNote(true);
                        setNoteForm({ title: '', content: '', type: 'spreadsheet', tags: [] });
                        setShowFabMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow-lg text-sm whitespace-nowrap"
                    >
                      <Table size={16} /> New Spreadsheet
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowNewNote(true); setNoteForm({ title: '', content: '', type: 'text', tags: [] }); setShowFabMenu(false); }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-sm whitespace-nowrap"
                    >
                      <Plus size={16} /> New Note
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowFabMenu(!showFabMenu)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${showFabMenu ? 'bg-zinc-600 rotate-45' : isSpreadsheetContext ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <Plus size={24} />
              </button>
            </div>

            {/* Click outside to close FAB menu */}
            {showFabMenu && (
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowFabMenu(false)}
              />
            )}
          </>
        );
      })()}

      {/* Modals */}

      {/* Move Note Modal */}
      {showMoveNote && movingNoteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h2 className="font-semibold flex items-center gap-2">
                <Move size={20} className="text-blue-500" />
                Move Note to Notebook
              </h2>
              <button onClick={() => { setShowMoveNote(false); setMovingNoteId(null); }} className="p-1 hover:bg-zinc-700 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-zinc-400 mb-4">
                Select a notebook to move "{notes.find(n => n.id === movingNoteId)?.title}" to:
              </p>
              <div className="space-y-2 max-h-64 overflow-auto">
                {notebooks.filter(n => n.type !== 'prompts' && n.id !== notes.find(note => note.id === movingNoteId)?.notebookId).map(notebook => (
                  <button
                    key={notebook.id}
                    onClick={async () => {
                      await moveNoteToNotebook(movingNoteId, notebook.id);
                      setShowMoveNote(false);
                      setMovingNoteId(null);
                      setActiveNotebook(notebook.id);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-700 text-left transition-colors"
                  >
                    <Notebook size={18} className="text-purple-500" />
                    <span>{notebook.name}</span>
                  </button>
                ))}
                {notebooks.filter(n => n.type !== 'prompts' && n.id !== notes.find(note => note.id === movingNoteId)?.notebookId).length === 0 && (
                  <p className="text-zinc-500 text-sm text-center py-4">
                    No other notebooks available. Create a new notebook first.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
              <button
                onClick={() => { setShowMoveNote(false); setMovingNoteId(null); }}
                className="px-4 py-2 text-sm hover:bg-zinc-700 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Notebook Modal */}
      {showNewNotebook && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h2 className="font-semibold flex items-center gap-2">
                <Notebook size={20} className="text-purple-500" />
                Create New Notebook
              </h2>
              <button onClick={() => { setShowNewNotebook(false); setNewNotebookName(''); }} className="p-1 hover:bg-zinc-700 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm text-zinc-400 mb-2">Notebook Name</label>
              <input
                type="text"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                placeholder="My Notebook"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') createNotebook(); }}
              />
              <p className="text-xs text-zinc-500 mt-2">
                Create a notebook to organize your notes. You can add, edit, and delete notes within each notebook.
              </p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
              <button
                onClick={() => { setShowNewNotebook(false); setNewNotebookName(''); }}
                className="px-4 py-2 text-sm hover:bg-zinc-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createNotebook}
                disabled={!newNotebookName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded flex items-center gap-2"
              >
                <Plus size={14} /> Create Notebook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Note Modal */}
      {showNewNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h2 className="font-semibold flex items-center gap-2">
                {noteForm.type === 'spreadsheet' ? (
                  <Table size={20} className="text-green-500" />
                ) : noteForm.type === 'prompt' ? (
                  <MessageSquare size={20} className="text-purple-500" />
                ) : (
                  <FileText size={20} className="text-blue-500" />
                )}
                Create New Note
              </h2>
              <button onClick={() => { setShowNewNote(false); setNoteForm({ title: '', content: '', type: 'text', tags: [] }); setSelectedSpreadsheetTemplate(null); }} className="p-1 hover:bg-zinc-700 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Template</label>
                <div className="grid grid-cols-2 gap-3">
                  {noteTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setNoteForm(prev => ({ ...prev, type: template.id }));
                        if (template.id !== 'spreadsheet') {
                          setSelectedSpreadsheetTemplate(null);
                        }
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        noteForm.type === template.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {template.icon === 'Table' ? (
                          <Table size={20} className={noteForm.type === template.id ? 'text-blue-400' : 'text-zinc-400'} />
                        ) : template.icon === 'MessageSquare' ? (
                          <MessageSquare size={20} className={noteForm.type === template.id ? 'text-blue-400' : 'text-zinc-400'} />
                        ) : (
                          <FileText size={20} className={noteForm.type === template.id ? 'text-blue-400' : 'text-zinc-400'} />
                        )}
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Title</label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Note title"
                  autoFocus
                />
              </div>

              {/* Only show content field for text notes */}
              {noteForm.type === 'text' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Content (optional)</label>
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500"
                    placeholder="Write your note content here... You can paste any text content."
                  />
                </div>
              )}

              {noteForm.type === 'spreadsheet' && (
                <div className="space-y-4">
                  <label className="block text-sm text-zinc-400">Choose a Spreadsheet Template</label>
                  {spreadsheetCategories.map(category => (
                    <div key={category.id} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {category.icon === 'Heart' ? (
                          <Heart size={18} className="text-red-400" />
                        ) : category.icon === 'DollarSign' ? (
                          <DollarSign size={18} className="text-green-400" />
                        ) : (
                          <Target size={18} className="text-blue-400" />
                        )}
                        <h3 className="font-medium text-sm">{category.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {category.templates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedSpreadsheetTemplate(template)}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              selectedSpreadsheetTemplate?.id === template.id
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                            }`}
                          >
                            <div className="font-medium text-sm mb-1">{template.name}</div>
                            <p className="text-xs text-zinc-500">{template.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* Blank spreadsheet option */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Table size={18} className="text-zinc-400" />
                      <h3 className="font-medium text-sm">Blank</h3>
                    </div>
                    <button
                      onClick={() => setSelectedSpreadsheetTemplate({ id: 'blank', name: 'Blank Spreadsheet', data: null })}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedSpreadsheetTemplate?.id === 'blank'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">Blank Spreadsheet</div>
                      <p className="text-xs text-zinc-500">Start with 3 empty columns and rows</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Prompt-specific fields */}
              {noteForm.type === 'prompt' && (
                <>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Prompt Content</label>
                    <textarea
                      value={noteForm.content}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500"
                      placeholder="Enter your AI prompt here..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(noteForm.tags || []).map(tag => (
                        <span key={tag} className="bg-purple-600/30 text-purple-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                          {tag}
                          <button
                            onClick={() => setNoteForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }))}
                            className="hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Type a tag and press Enter"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          e.preventDefault();
                          const newTag = e.target.value.trim().toLowerCase();
                          if (!(noteForm.tags || []).includes(newTag)) {
                            setNoteForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                    {/* Suggested tags */}
                    {data.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-zinc-500">Suggestions:</span>
                        {data.tags.filter(t => !(noteForm.tags || []).includes(t)).slice(0, 10).map(tag => (
                          <button
                            key={tag}
                            onClick={() => setNoteForm(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }))}
                            className="text-xs px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
              <button
                onClick={() => { setShowNewNote(false); setNoteForm({ title: '', content: '', type: 'text', tags: [] }); }}
                className="px-4 py-2 text-sm hover:bg-zinc-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createNote}
                disabled={!noteForm.title.trim()}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded flex items-center gap-2"
              >
                <Plus size={14} /> Create Note
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewPrompt && (
        <PromptModal
          defaultFolderId={newPromptFolder}
          onSave={addPrompt}
          onClose={() => { setShowNewPrompt(false); setNewPromptFolder(null); }}
          newlyCreatedFolderId={createdFolderIdForPrompt}
          onConsumeNewlyCreatedFolder={() => setCreatedFolderIdForPrompt(null)}
          onOpenNewRootFolder={() => { setNewFolderParent(null); setShowNewFolder(true); }}
          onOpenNewSubfolder={(parentId) => { setNewFolderParent(parentId); setShowNewFolder(true); }}
        />
      )}
      {editingPrompt && (
        <PromptModal
          prompt={editingPrompt}
          onSave={(form) => updatePrompt(editingPrompt.id, form)}
          onClose={() => setEditingPrompt(null)}
          newlyCreatedFolderId={createdFolderIdForPrompt}
          onConsumeNewlyCreatedFolder={() => setCreatedFolderIdForPrompt(null)}
          onOpenNewRootFolder={() => { setNewFolderParent(null); setShowNewFolder(true); }}
          onOpenNewSubfolder={(parentId) => { setNewFolderParent(parentId); setShowNewFolder(true); }}
        />
      )}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-zinc-800 rounded-lg p-4 w-96">
            <h3 className="font-semibold mb-3">New Folder</h3>
            <input
              id="new-folder-input"
              autoFocus
              placeholder="Folder name..."
              className="w-full bg-zinc-900 rounded px-3 py-2 text-sm mb-3"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) addFolder(e.target.value.trim(), newFolderParent); }}
            />
            <div className="mb-3">
              <label className="text-sm text-zinc-400 mb-1 block">Parent Folder</label>
              <FolderPathSelector
                selectedFolderId={newFolderParent}
                onSelect={(folderId) => setNewFolderParent(folderId)}
                folders={data.folders}
                includeRootInSearch
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowNewFolder(false); setNewFolderParent(null); }} className="px-3 py-1.5 text-sm hover:bg-zinc-700 rounded">Cancel</button>
              <button onClick={() => { const input = document.getElementById('new-folder-input'); if (input?.value.trim()) addFolder(input.value.trim(), newFolderParent); }} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded">Create</button>
            </div>
          </div>
        </div>
      )}
      {/* Move Notification */}
      {moveNotification && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <Check size={16} /> {moveNotification}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)}>
          <div className="absolute bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 w-48" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button onClick={() => { setRenameFolder(contextMenu.folderId); setRenameFolderValue(contextMenu.folderName); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 flex items-center gap-2"><Edit2 size={14} /> Rename</button>
            <button onClick={() => { setNewFolderParent(contextMenu.folderId); setShowNewFolder(true); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 flex items-center gap-2"><FolderPlus size={14} /> Add Subfolder</button>
            <button onClick={() => { setNewPromptFolder(contextMenu.folderId); setShowNewPrompt(true); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 flex items-center gap-2"><Plus size={14} /> Add Prompt</button>
            <div className="border-t border-zinc-700 my-1" />
            <button onClick={() => { deleteFolder(contextMenu.folderId); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 text-red-400 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      )}

      {/* Backup/Restore Modal */}
      {showBackupRestore && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h2 className="font-semibold">Restore from Backup</h2>
              <button onClick={() => { setShowBackupRestore(false); setBackupPreview(null); }} className="p-1 hover:bg-zinc-700 rounded"><X size={18} /></button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {!backupPreview ? (
                <div>
                  <div className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center mb-4">
                    <Upload size={32} className="mx-auto mb-3 text-zinc-500" />
                    <p className="text-sm text-zinc-400 mb-3">Upload a Prompt Repository backup file</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer text-sm">
                      <Upload size={14} /> Choose Backup File
                      <input type="file" accept=".json" onChange={handleBackupFile} className="hidden" />
                    </label>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-4 text-sm text-zinc-400">
                    <p className="mb-2"><strong className="text-zinc-300">How it works:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Upload a backup file previously exported from Prompt Repository</li>
                      <li>Preview what will be imported before confirming</li>
                      <li>Choose to <strong className="text-zinc-300">Replace</strong> all data or <strong className="text-zinc-300">Merge</strong> with existing</li>
                      <li>All folders, subfolders, prompts, tags, and categories will be restored</li>
                    </ul>
                  </div>
                </div>
              ) : !backupPreview.valid ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-2">Invalid Backup File</div>
                  <p className="text-sm text-zinc-400 mb-4">{backupPreview.error}</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded cursor-pointer text-sm">
                    Try Another File
                    <input type="file" accept=".json" onChange={handleBackupFile} className="hidden" />
                  </label>
                </div>
              ) : (
                <div>
                  <div className="bg-zinc-900 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={18} className="text-blue-400" />
                      <span className="font-medium">{backupPreview.fileName}</span>
                    </div>
                    {backupPreview.exportDate && (
                      <div className="text-xs text-zinc-500 mb-3">
                        Exported: {new Date(backupPreview.exportDate).toLocaleString()}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-800 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{backupPreview.folderCount}</div>
                        <div className="text-xs text-zinc-400">Folders</div>
                      </div>
                      <div className="bg-zinc-800 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-blue-400">{backupPreview.promptCount}</div>
                        <div className="text-xs text-zinc-400">Prompts</div>
                      </div>
                      <div className="bg-zinc-800 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">{backupPreview.tagCount}</div>
                        <div className="text-xs text-zinc-400">Tags</div>
                      </div>
                      <div className="bg-zinc-800 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-purple-400">{backupPreview.categoryCount}</div>
                        <div className="text-xs text-zinc-400">Tag Categories</div>
                      </div>
                    </div>
                  </div>

                  {backupPreview.rootFolders.length > 0 && (
                    <div className="bg-zinc-900 rounded-lg p-4 mb-4">
                      <div className="text-sm text-zinc-400 mb-2">Root Folders:</div>
                      <div className="flex flex-wrap gap-2">
                        {backupPreview.rootFolders.map(f => (
                          <span key={f.id} className="px-2 py-1 bg-zinc-800 rounded text-sm flex items-center gap-1">
                            <Folder size={12} className="text-yellow-500" /> {f.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => restoreFromBackup('replace')}
                      className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-left"
                    >
                      <div className="font-medium">Replace All</div>
                      <div className="text-xs text-blue-200">Clear existing data and restore from backup</div>
                    </button>
                    <button
                      onClick={() => restoreFromBackup('merge')}
                      className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-left"
                    >
                      <div className="font-medium">Merge</div>
                      <div className="text-xs text-zinc-400">Add new items, keep existing data</div>
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <label className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">
                      Choose a different file
                      <input type="file" accept=".json" onChange={handleBackupFile} className="hidden" />
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t border-zinc-700">
              <button onClick={() => { setShowBackupRestore(false); setBackupPreview(null); }} className="px-4 py-2 text-sm hover:bg-zinc-700 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renameFolder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-4 w-80">
            <h3 className="font-semibold mb-3">Rename Folder</h3>
            <input
              autoFocus
              value={renameFolderValue}
              onChange={(e) => setRenameFolderValue(e.target.value)}
              className="w-full bg-zinc-900 rounded px-3 py-2 text-sm mb-3"
              onKeyDown={(e) => { if (e.key === 'Enter' && renameFolderValue.trim()) { updateFolder(renameFolder, renameFolderValue.trim()); setRenameFolder(null); } }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRenameFolder(null)} className="px-3 py-1.5 text-sm hover:bg-zinc-700 rounded">Cancel</button>
              <button onClick={() => { if (renameFolderValue.trim()) { updateFolder(renameFolder, renameFolderValue.trim()); setRenameFolder(null); } }} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded">Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Prompt Modal */}
      {movingPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-4 w-96">
            <h3 className="font-semibold mb-1">Move Prompt</h3>
            <p className="text-sm text-zinc-400 mb-4">"{movingPrompt.title}"</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search folders..."
                className="w-full bg-zinc-900 rounded px-3 py-2 pl-9 text-sm"
                onChange={(e) => setMovingPrompt({ ...movingPrompt, search: e.target.value })}
                value={movingPrompt.search || ''}
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-auto bg-zinc-900 rounded-lg mb-4">
              {getSortedFoldersHierarchically()
                .filter(f => {
                  if (!movingPrompt.search) return true;
                  return getFolderPath(f.id).toLowerCase().includes(movingPrompt.search.toLowerCase());
                })
                .map(f => {
                  const isCurrentFolder = f.id === movingPrompt.folderId;
                  return (
                    <button
                      key={f.id}
                      disabled={isCurrentFolder}
                      onClick={() => {
                        movePrompt(movingPrompt.id, f.id);
                        setMovingPrompt(null);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${isCurrentFolder ? 'opacity-50 cursor-not-allowed bg-zinc-800' : 'hover:bg-zinc-700'}`}
                    >
                      <span style={{ width: `${f.depth * 16}px` }} className="flex-shrink-0" />
                      <Folder size={14} className="text-yellow-500 flex-shrink-0" />
                      <span className="truncate">{f.name}</span>
                      {isCurrentFolder && <span className="ml-auto text-xs text-zinc-500 flex-shrink-0">(current)</span>}
                    </button>
                  );
                })}
              {getSortedFoldersHierarchically().filter(f => {
                if (!movingPrompt.search) return true;
                return getFolderPath(f.id).toLowerCase().includes(movingPrompt.search.toLowerCase());
              }).length === 0 && (
                  <div className="px-3 py-4 text-sm text-zinc-500 text-center">No folders found</div>
                )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setMovingPrompt(null)} className="px-3 py-1.5 text-sm hover:bg-zinc-700 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Move Modal */}
      {showBulkMove && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-4 w-96">
            <h3 className="font-semibold mb-1">Move Prompts</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Move {selectedPrompts.size} prompt{selectedPrompts.size > 1 ? 's' : ''} to a folder
            </p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search folders..."
                className="w-full bg-zinc-900 rounded px-3 py-2 pl-9 text-sm"
                onChange={(e) => setBulkMoveSearch(e.target.value)}
                value={bulkMoveSearch}
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-auto bg-zinc-900 rounded-lg mb-4">
              {/* New root folder button */}
              <button
                onClick={() => setBulkMoveNewFolder({ show: true, parentId: null, name: '' })}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-zinc-700 text-blue-400 border-b border-zinc-700"
              >
                <FolderPlus size={14} />
                <span>Create new folder</span>
              </button>
              {/* Inline new folder form for root level */}
              {bulkMoveNewFolder.show && bulkMoveNewFolder.parentId === null && (
                <div className="px-3 py-2 bg-zinc-800 border-b border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Folder size={14} className="text-yellow-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Folder name..."
                      value={bulkMoveNewFolder.name}
                      onChange={(e) => setBulkMoveNewFolder(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') createFolderInBulkMove(); if (e.key === 'Escape') setBulkMoveNewFolder({ show: false, parentId: null, name: '' }); }}
                      className="flex-1 bg-zinc-900 rounded px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button onClick={createFolderInBulkMove} className="p-1 hover:bg-zinc-600 rounded text-green-400"><Check size={14} /></button>
                    <button onClick={() => setBulkMoveNewFolder({ show: false, parentId: null, name: '' })} className="p-1 hover:bg-zinc-600 rounded text-zinc-400"><X size={14} /></button>
                  </div>
                </div>
              )}
              {getSortedFoldersHierarchically()
                .filter(f => {
                  if (!bulkMoveSearch) return true;
                  return getFolderPath(f.id).toLowerCase().includes(bulkMoveSearch.toLowerCase());
                })
                .map(f => {
                  // Check if all selected prompts are already in this folder
                  const selectedPromptsList = Array.from(selectedPrompts);
                  const allInThisFolder = selectedPromptsList.every(pid => {
                    const prompt = data.prompts.find(p => p.id === pid);
                    return prompt?.folderId === f.id;
                  });
                  const isCreatingSubfolder = bulkMoveNewFolder.show && bulkMoveNewFolder.parentId === f.id;
                  return (
                    <div key={f.id}>
                      <div
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 group ${allInThisFolder ? 'opacity-50 bg-zinc-800' : 'hover:bg-zinc-700'}`}
                      >
                        <span style={{ width: `${f.depth * 16}px` }} className="flex-shrink-0" />
                        <Folder size={14} className="text-yellow-500 flex-shrink-0" />
                        <button
                          disabled={allInThisFolder}
                          onClick={() => {
                            bulkMovePrompts(f.id);
                            setBulkMoveSearch('');
                          }}
                          className={`flex-1 text-left truncate ${allInThisFolder ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {f.name}
                        </button>
                        {allInThisFolder && <span className="text-xs text-zinc-500 flex-shrink-0">(all here)</span>}
                        {!allInThisFolder && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setBulkMoveNewFolder({ show: true, parentId: f.id, name: '' }); }}
                            className="p-1 hover:bg-zinc-600 rounded opacity-0 group-hover:opacity-100 transition-opacity text-blue-400"
                            title="Create subfolder"
                          >
                            <Plus size={12} />
                          </button>
                        )}
                      </div>
                      {/* Inline new subfolder form */}
                      {isCreatingSubfolder && (
                        <div className="px-3 py-2 bg-zinc-800">
                          <div className="flex items-center gap-2">
                            <span style={{ width: `${(f.depth + 1) * 16}px` }} className="flex-shrink-0" />
                            <Folder size={14} className="text-yellow-500 flex-shrink-0" />
                            <input
                              type="text"
                              placeholder="Subfolder name..."
                              value={bulkMoveNewFolder.name}
                              onChange={(e) => setBulkMoveNewFolder(prev => ({ ...prev, name: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') createFolderInBulkMove(); if (e.key === 'Escape') setBulkMoveNewFolder({ show: false, parentId: null, name: '' }); }}
                              className="flex-1 bg-zinc-900 rounded px-2 py-1 text-sm"
                              autoFocus
                            />
                            <button onClick={createFolderInBulkMove} className="p-1 hover:bg-zinc-600 rounded text-green-400"><Check size={14} /></button>
                            <button onClick={() => setBulkMoveNewFolder({ show: false, parentId: null, name: '' })} className="p-1 hover:bg-zinc-600 rounded text-zinc-400"><X size={14} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              {getSortedFoldersHierarchically().filter(f => {
                if (!bulkMoveSearch) return true;
                return getFolderPath(f.id).toLowerCase().includes(bulkMoveSearch.toLowerCase());
              }).length === 0 && !bulkMoveNewFolder.show && (
                  <div className="px-3 py-4 text-sm text-zinc-500 text-center">No folders found</div>
                )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => { setShowBulkMove(false); setBulkMoveSearch(''); setBulkMoveNewFolder({ show: false, parentId: null, name: '' }); }} className="px-3 py-1.5 text-sm hover:bg-zinc-700 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h2 className="font-semibold">Bulk Import Prompts</h2>
              <button onClick={() => { setShowBulkImport(false); setBulkImportData({ prompts: [], folderId: null, tags: [], isFullBackup: false, folders: [] }); }} className="p-1 hover:bg-zinc-700 rounded"><X size={18} /></button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {bulkImportData.prompts.length === 0 ? (
                <div>
                  <div className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center mb-4">
                    <Upload size={32} className="mx-auto mb-3 text-zinc-500" />
                    <p className="text-sm text-zinc-400 mb-3">Upload a file with your prompts</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer text-sm">
                      <Upload size={14} /> Choose File
                      <input type="file" accept=".txt,.md,.json,.csv" onChange={handleBulkImportFile} className="hidden" />
                    </label>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">Supported Formats:</h4>
                    <div className="space-y-3 text-xs text-zinc-400">
                      <div>
                        <span className="text-zinc-300 font-medium">JSON:</span>
                        <pre className="mt-1 bg-zinc-800 p-2 rounded overflow-x-auto">{`[{"title": "Prompt Name", "content": "Prompt text..."}]`}</pre>
                      </div>
                      <div>
                        <span className="text-zinc-300 font-medium">CSV:</span>
                        <pre className="mt-1 bg-zinc-800 p-2 rounded overflow-x-auto">{`title,content\n"My Prompt","The prompt text here"`}</pre>
                      </div>
                      <div>
                        <span className="text-zinc-300 font-medium">Markdown:</span>
                        <pre className="mt-1 bg-zinc-800 p-2 rounded overflow-x-auto">{`## Prompt Title\nThe prompt content here...\n\n## Another Prompt\nMore content...`}</pre>
                      </div>
                      <div>
                        <span className="text-zinc-300 font-medium">Plain Text:</span>
                        <pre className="mt-1 bg-zinc-800 p-2 rounded overflow-x-auto">{`Title: My Prompt\nPrompt: The prompt text here...\n\nTitle: Another\nPrompt: More content...`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ) : bulkImportData.isFullBackup ? (
                /* Full Backup Import UI */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded mr-2">Full Backup</span>
                      <span className="text-sm text-zinc-400">from {bulkImportData.fileName}</span>
                    </div>
                    <label className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded cursor-pointer">
                      Choose Different File
                      <input type="file" accept=".txt,.md,.json,.csv" onChange={handleBulkImportFile} className="hidden" />
                    </label>
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium mb-3">Import Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Folder size={16} className="text-yellow-500" />
                        <span>{bulkImportData.folders.length} folder{bulkImportData.folders.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-400" />
                        <span>{bulkImportData.prompts.filter(p => p.selected !== false).length} prompt{bulkImportData.prompts.filter(p => p.selected !== false).length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-zinc-400 mb-2">Folders to create:</div>
                    <div className="bg-zinc-900 rounded-lg p-3 max-h-32 overflow-auto">
                      {bulkImportData.folders.map((folder, idx) => {
                        const parent = bulkImportData.folders.find(f => f.id === folder.parentId);
                        return (
                          <div key={idx} className="flex items-center gap-2 py-1 text-sm">
                            <Folder size={14} className="text-yellow-500" />
                            <span>{folder.name}</span>
                            {parent && <span className="text-xs text-zinc-500">(in {parent.name})</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-zinc-400">Prompts ({bulkImportData.prompts.filter(p => p.selected !== false).length} selected)</label>
                      <div className="flex gap-2">
                        <button onClick={() => setBulkImportData(prev => ({ ...prev, prompts: prev.prompts.map(p => ({ ...p, selected: true })) }))} className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded">Select All</button>
                        <button onClick={() => setBulkImportData(prev => ({ ...prev, prompts: prev.prompts.map(p => ({ ...p, selected: false })) }))} className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded">Deselect All</button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {bulkImportData.prompts.map((prompt, index) => {
                        const folder = bulkImportData.folders.find(f => f.id === prompt.folderId);
                        return (
                          <div
                            key={index}
                            onClick={() => toggleBulkImportPrompt(index)}
                            className={`bg-zinc-900 rounded-lg p-3 cursor-pointer border-2 transition-colors ${prompt.selected === false ? 'border-transparent opacity-50' : 'border-blue-500/50'}`}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={prompt.selected !== false}
                                onChange={() => toggleBulkImportPrompt(index)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{prompt.title}</div>
                                {folder && <div className="text-xs text-zinc-500">in {folder.name}</div>}
                                <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{getPromptDisplayContent(prompt.content)}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Simple Prompts Import UI */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm text-zinc-400">Found </span>
                      <span className="font-medium">{bulkImportData.prompts.length} prompts</span>
                      <span className="text-sm text-zinc-400"> in {bulkImportData.fileName}</span>
                    </div>
                    <label className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded cursor-pointer">
                      Choose Different File
                      <input type="file" accept=".txt,.md,.json,.csv" onChange={handleBulkImportFile} className="hidden" />
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm text-zinc-400 mb-1 block">Import to Folder *</label>
                    <select
                      value={bulkImportData.folderId || ''}
                      onChange={(e) => setBulkImportData(prev => ({ ...prev, folderId: e.target.value || null }))}
                      className="w-full bg-zinc-900 rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select a folder...</option>
                      {getSortedFoldersHierarchically().map(f => (
                        <option key={f.id} value={f.id}>
                          {'—'.repeat(f.depth)} {f.depth > 0 ? ' ' : ''}{f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm text-zinc-400 mb-1 block">Add Tags to All (optional)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {bulkImportData.tags.map(tag => (
                        <span key={tag} className="bg-zinc-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                          {tag}
                          <button onClick={() => setBulkImportData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} className="hover:text-red-400"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                    <input
                      placeholder="Type tag and press Enter..."
                      className="w-full bg-zinc-900 rounded px-3 py-2 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          setBulkImportData(prev => ({ ...prev, tags: [...new Set([...prev.tags, e.target.value.trim().toLowerCase()])] }));
                          e.target.value = '';
                        }
                      }}
                    />
                    {bulkImportData.folderId && getTagsInFolder(bulkImportData.folderId).length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-zinc-500">Suggested from this folder:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getTagsInFolder(bulkImportData.folderId)
                            .filter(t => !bulkImportData.tags.includes(t))
                            .map(tag => (
                              <button
                                key={tag}
                                onClick={() => setBulkImportData(prev => ({ ...prev, tags: [...new Set([...prev.tags, tag])] }))}
                                className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded"
                              >
                                + {tag}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                    {bulkImportData.folderId && getTagsInFolder(bulkImportData.folderId).length === 0 && (
                      <div className="mt-2 text-xs text-zinc-500 italic">No existing tags in this folder</div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-zinc-400">Preview ({bulkImportData.prompts.filter(p => p.selected !== false).length} selected)</label>
                      <div className="flex gap-2">
                        <button onClick={() => setBulkImportData(prev => ({ ...prev, prompts: prev.prompts.map(p => ({ ...p, selected: true })) }))} className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded">Select All</button>
                        <button onClick={() => setBulkImportData(prev => ({ ...prev, prompts: prev.prompts.map(p => ({ ...p, selected: false })) }))} className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded">Deselect All</button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {bulkImportData.prompts.map((prompt, index) => (
                        <div
                          key={index}
                          onClick={() => toggleBulkImportPrompt(index)}
                          className={`bg-zinc-900 rounded-lg p-3 cursor-pointer border-2 transition-colors ${prompt.selected === false ? 'border-transparent opacity-50' : 'border-blue-500/50'}`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={prompt.selected !== false}
                              onChange={() => toggleBulkImportPrompt(index)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{prompt.title}</div>
                              <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{getPromptDisplayContent(prompt.content)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
              <button onClick={() => { setShowBulkImport(false); setBulkImportData({ prompts: [], folderId: null, tags: [], isFullBackup: false, folders: [] }); }} className="px-4 py-2 text-sm hover:bg-zinc-700 rounded">Cancel</button>
              <button
                onClick={executeBulkImport}
                disabled={bulkImportData.isFullBackup ? bulkImportData.prompts.filter(p => p.selected !== false).length === 0 : (!bulkImportData.folderId || bulkImportData.prompts.filter(p => p.selected !== false).length === 0)}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download size={14} />
                {bulkImportData.isFullBackup
                  ? `Import ${bulkImportData.folders.length} Folders & ${bulkImportData.prompts.filter(p => p.selected !== false).length} Prompts`
                  : `Import ${bulkImportData.prompts.filter(p => p.selected !== false).length} Prompts`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Duplicates Modal */}
      {showMergeDuplicates && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div>
                <h2 className="font-semibold">Merge Duplicate {mergeScopeParentId ? 'Subfolders' : 'Folders'}</h2>
                {mergeScopeParentId && (
                  <p className="text-xs text-zinc-500 mt-1">
                    in "{data.folders.find(f => f.id === mergeScopeParentId)?.name}"
                  </p>
                )}
              </div>
              <button onClick={() => { setShowMergeDuplicates(false); setDuplicateFolders([]); setExpandedDuplicateGroups(new Set()); setMergeScopeParentId(null); }} className="p-1 hover:bg-zinc-700 rounded"><X size={18} /></button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {duplicateFolders.length === 0 ? (
                <div className="text-center py-8">
                  <GitMerge size={48} className="mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">No duplicate {mergeScopeParentId ? 'subfolders' : 'folders'} found!</p>
                  <p className="text-sm text-zinc-500 mt-2">All {mergeScopeParentId ? 'subfolders' : 'folders'} have unique names.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-400">
                      Found {duplicateFolders.length} group{duplicateFolders.length !== 1 ? 's' : ''} of {mergeScopeParentId ? 'subfolders' : 'folders'} with identical names.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedDuplicateGroups(new Set(duplicateFolders.map((_, i) => i)))}
                        className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded"
                      >
                        Expand All
                      </button>
                      <button
                        onClick={() => setExpandedDuplicateGroups(new Set())}
                        className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded"
                      >
                        Collapse All
                      </button>
                    </div>
                  </div>
                  {duplicateFolders.map((group, groupIndex) => {
                    const isExpanded = expandedDuplicateGroups.has(groupIndex);
                    const totalPrompts = group.folders.reduce((acc, f) => acc + f.promptCount, 0);
                    const totalSubfolders = group.folders.reduce((acc, f) => acc + f.subfolderCount, 0);
                    return (
                      <div key={groupIndex} className="bg-zinc-900 rounded-lg overflow-hidden">
                        {/* Accordion Header */}
                        <div
                          onClick={() => toggleDuplicateGroup(groupIndex)}
                          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
                          <Folder size={16} className="text-yellow-500" />
                          <span className="font-medium flex-1">{group.name}</span>
                          <span className="text-xs text-zinc-500">{group.folders.length} duplicates</span>
                          <span className="text-xs text-zinc-600">|</span>
                          <span className="text-xs text-zinc-500">{totalPrompts} prompts, {totalSubfolders} subfolders</span>
                        </div>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-zinc-800">
                            <p className="text-xs text-zinc-500 mt-3 mb-3">
                              Select which folder to keep - all prompts and subfolders will be merged into it.
                            </p>
                            <div className="space-y-2 mb-4">
                              {group.folders.map((folder) => (
                                <label
                                  key={folder.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                    group.targetId === folder.id
                                      ? 'bg-blue-600/20 border border-blue-500/50'
                                      : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`merge-target-${groupIndex}`}
                                    checked={group.targetId === folder.id}
                                    onChange={() => setMergeTarget(groupIndex, folder.id)}
                                    className="text-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{folder.path}</div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                      <span>{folder.promptCount} prompt{folder.promptCount !== 1 ? 's' : ''}</span>
                                      <span>{folder.subfolderCount} subfolder{folder.subfolderCount !== 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                  {group.targetId === folder.id && (
                                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">Keep</span>
                                  )}
                                </label>
                              ))}
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); mergeSingleGroup(groupIndex); }}
                                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
                              >
                                <GitMerge size={12} /> Merge This Group
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
              <button onClick={() => { setShowMergeDuplicates(false); setDuplicateFolders([]); setExpandedDuplicateGroups(new Set()); setMergeScopeParentId(null); }} className="px-4 py-2 text-sm hover:bg-zinc-700 rounded">Close</button>
              {duplicateFolders.length > 0 && (
                <button
                  onClick={executeMergeDuplicates}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 rounded flex items-center gap-2"
                >
                  <GitMerge size={14} /> Merge All ({duplicateFolders.reduce((acc, g) => acc + g.folders.length - 1, 0)} folders)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Prompts Modal */}
      {showDuplicatePrompts && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div>
                <h2 className="font-semibold">Remove Duplicate Prompts</h2>
                {duplicatePromptsFolderId && (
                  <p className="text-xs text-zinc-500 mt-1">
                    in "{data.folders.find(f => f.id === duplicatePromptsFolderId)?.name}"
                  </p>
                )}
              </div>
              <button onClick={() => { setShowDuplicatePrompts(false); setDuplicatePromptGroups([]); setDuplicatePromptsFolderId(null); }} className="p-1 hover:bg-zinc-700 rounded"><X size={18} /></button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {duplicatePromptGroups.length === 0 ? (
                <div className="text-center py-8">
                  <Copy size={48} className="mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">No duplicate prompts found!</p>
                  <p className="text-sm text-zinc-500 mt-2">All prompts have unique titles.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-400">
                    Found {duplicatePromptGroups.length} group{duplicatePromptGroups.length !== 1 ? 's' : ''} of prompts with identical titles.
                    Select which prompt to keep from each group - the others will be deleted.
                  </p>
                  {duplicatePromptGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="bg-zinc-900 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-blue-500" />
                        <span className="font-medium">{group.title}</span>
                        <span className="text-xs text-zinc-500 ml-auto">{group.prompts.length} duplicates</span>
                      </div>
                      <div className="space-y-2">
                        {group.prompts.map((prompt) => (
                          <label
                            key={prompt.id}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              group.keepId === prompt.id
                                ? 'bg-green-600/20 border border-green-500/50'
                                : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`keep-prompt-${groupIndex}`}
                              checked={group.keepId === prompt.id}
                              onChange={() => setKeepPrompt(groupIndex, prompt.id)}
                              className="mt-1 text-green-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{prompt.title}</div>
                              <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{getPromptDisplayContent(prompt.content).substring(0, 150)}{getPromptDisplayContent(prompt.content).length > 150 ? '...' : ''}</div>
                              {prompt.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {prompt.tags.map(tag => (
                                    <span key={tag} className="text-xs px-1.5 py-0.5 bg-zinc-700 rounded">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {group.keepId === prompt.id ? (
                              <span className="text-xs bg-green-600 px-2 py-1 rounded whitespace-nowrap">Keep</span>
                            ) : (
                              <span className="text-xs bg-red-600/50 px-2 py-1 rounded whitespace-nowrap">Delete</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
              <button onClick={() => { setShowDuplicatePrompts(false); setDuplicatePromptGroups([]); setDuplicatePromptsFolderId(null); }} className="px-4 py-2 text-sm hover:bg-zinc-700 rounded">Cancel</button>
              {duplicatePromptGroups.length > 0 && (
                <button
                  onClick={deleteDuplicatePrompts}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete {duplicatePromptGroups.reduce((acc, g) => acc + g.prompts.length - 1, 0)} Duplicates
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tag Category Manager Modal */}
      {showTagCategoryManager && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h2 className="font-semibold">Manage Tag Categories</h2>
              <button onClick={() => setShowTagCategoryManager(false)} className="p-1 hover:bg-zinc-700 rounded"><X size={18} /></button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="mb-4">
                <label className="text-sm text-zinc-400 mb-2 block">Add New Category</label>
                <div className="flex gap-2">
                  <input
                    id="new-category-input"
                    placeholder="Category name (e.g., Writing, Coding, Marketing)"
                    className="flex-1 bg-zinc-900 rounded px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addTagCategory(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('new-category-input');
                      if (input?.value.trim()) {
                        addTagCategory(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(data.tagCategories || []).map(category => (
                  <div key={category.id} className="bg-zinc-900 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        defaultValue={category.name}
                        className="bg-transparent font-medium text-sm border-b border-transparent hover:border-zinc-600 focus:border-blue-500 focus:outline-none"
                        onBlur={(e) => updateTagCategory(category.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                      />
                      <button onClick={() => deleteTagCategory(category.id)} className="p-1 hover:bg-zinc-700 rounded text-red-400"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {category.tags.map(tag => (
                        <span key={tag} className="bg-zinc-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                          {tag}
                          <button onClick={() => removeTagFromCategory(tag, category.id)} className="hover:text-red-400"><X size={12} /></button>
                        </span>
                      ))}
                      {category.tags.length === 0 && <span className="text-xs text-zinc-600 italic">No tags assigned</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-zinc-500 mr-1">Add:</span>
                      {data.tags.filter(t => !category.tags.includes(t)).slice(0, 8).map(tag => (
                        <button
                          key={tag}
                          onClick={() => assignTagToCategory(tag, category.id)}
                          className="text-xs px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded"
                        >
                          + {tag}
                        </button>
                      ))}
                      {data.tags.filter(t => !category.tags.includes(t)).length > 8 && (
                        <span className="text-xs text-zinc-500">+{data.tags.filter(t => !category.tags.includes(t)).length - 8} more</span>
                      )}
                      {data.tags.filter(t => !category.tags.includes(t)).length === 0 && (
                        <span className="text-xs text-zinc-600 italic">All tags added</span>
                      )}
                    </div>
                  </div>
                ))}

                {(data.tagCategories || []).length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    <Tag size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No categories yet</p>
                    <p className="text-xs">Create categories to organize your tags</p>
                  </div>
                )}

                {getUncategorizedTags().length > 0 && (data.tagCategories || []).length > 0 && (
                  <div className="bg-zinc-900/50 rounded-lg p-3 border border-dashed border-zinc-700">
                    <div className="text-sm text-zinc-400 mb-2">Uncategorized Tags ({getUncategorizedTags().length})</div>
                    <div className="flex flex-wrap gap-2">
                      {getUncategorizedTags().map(tag => (
                        <span key={tag} className="bg-zinc-800 px-2 py-1 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-zinc-700">
              <button onClick={() => setShowTagCategoryManager(false)} className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 rounded">Done</button>
            </div>
          </div>
        </div>
      )}
      </div>{/* End Main Content Area */}
    </div>
  );
}
