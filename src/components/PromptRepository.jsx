'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, FolderPlus, Copy, Check, ChevronRight, ChevronDown, Edit2, Trash2, X, Tag, Download, Upload, Folder, FileText, Save, Move, LayoutGrid, List, ChevronsDownUp, ChevronsUpDown, GitMerge, ArrowUpDown } from 'lucide-react';
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

  const showNotif = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
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

  const copyPrompt = (content, id) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = content;
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
            <pre className="text-xs text-zinc-300 bg-zinc-900 rounded p-3 whitespace-pre-wrap font-mono mb-3 max-h-64 overflow-auto">{prompt.content}</pre>
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
    const [form, setForm] = useState(prompt || { title: '', content: '', folderId: defaultFolderId || data.folders[0]?.id, tags: initialTags });
    const [tagInput, setTagInput] = useState('');
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
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Prompt Content</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="w-full bg-zinc-900 rounded px-3 py-2 text-sm font-mono" placeholder="Enter your prompt..." />
            </div>
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
            <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"><Save size={14} /> Save</button>
          </div>
        </div>
      </div>
    );
  };

  const rootPrompts = getFilteredPrompts(null);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-xl flex items-center gap-2"><FileText size={24} className="text-blue-500" /> Prompt Repository</h1>
          <div className="flex items-center gap-2">
            <button onClick={exportData} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded" title="Download full backup"><Download size={14} /> Backup</button>
            <button onClick={() => setShowBackupRestore(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded" title="Restore from backup"><Upload size={14} /> Restore</button>
            <button onClick={openMergeDuplicates} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded" title="Merge duplicate folders"><GitMerge size={14} /> Merge Duplicates</button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-zinc-800 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
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
          <button onClick={() => setShowTagManager(!showTagManager)} className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${showTagManager ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Tag size={14} /> Tags</button>
          <div className="h-6 w-px bg-zinc-700" />
          <button type="button" onClick={expandAllFolders} className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg">Expand All Folders</button>
          <button type="button" onClick={collapseAllFolders} className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg">Collapse All Folders</button>
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
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            <ArrowUpDown size={14} className="text-zinc-500 ml-2" />
            <button
              onClick={() => setFolderSort('name')}
              className={`px-2 py-1 text-xs rounded ${folderSort === 'name' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="Sort by name"
            >
              Name
            </button>
            <button
              onClick={() => setFolderSort('prompts')}
              className={`px-2 py-1 text-xs rounded ${folderSort === 'prompts' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="Sort by total prompts"
            >
              Prompts
            </button>
            <button
              onClick={() => setFolderSort('subfolders')}
              className={`px-2 py-1 text-xs rounded ${folderSort === 'subfolders' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="Sort by total subfolders"
            >
              Subfolders
            </button>
          </div>
          <div className="h-6 w-px bg-zinc-700" />
          <button onClick={() => { setShowNewFolder(true); setNewFolderParent(null); }} className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg"><FolderPlus size={14} /> Folder</button>
          <button onClick={() => { setShowNewPrompt(true); setNewPromptFolder(null); }} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg"><Plus size={14} /> Prompt</button>
          <button onClick={() => setShowBulkImport(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg"><Upload size={14} /> Bulk Import</button>
        </div>
      </div>

      {/* Tag Filter */}
      {showTagManager && (
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
      <div className="px-6 py-6">
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

      {/* Modals */}
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
                                <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{prompt.content}</div>
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
                              <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{prompt.content}</div>
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
    </div>
  );
}
