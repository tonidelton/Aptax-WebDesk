import { create } from 'zustand';
import {
  Shortcut,
  Folder,
  WindowState,
  TrashItem,
  ContextMenuState,
  WorkspaceState,
  DEFAULT_SHORTCUTS,
  WALLPAPERS,
} from './types';

// Gera ID único
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Carrega estado do localStorage
const loadState = (): Partial<WorkspaceState> => {
  try {
    const saved = localStorage.getItem('webdesk-state');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar estado:', e);
  }
  return {};
};

// Salva estado no localStorage
let saveTimeout: ReturnType<typeof setTimeout>;
const saveState = (state: WorkspaceState) => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const { windows, ...toSave } = state;
      localStorage.setItem('webdesk-state', JSON.stringify(toSave));
    } catch (e) {
      console.error('Erro ao salvar estado:', e);
    }
  }, 300);
};

const initialState: WorkspaceState = {
  shortcuts: DEFAULT_SHORTCUTS,
  folders: [],
  windows: [],
  trash: [],
  theme: 'dark',
  wallpaper: WALLPAPERS[0],
  nextZIndex: 100,
};

const saved = loadState();
const merged = { ...initialState, ...saved, windows: [] }; // Janelas não persistem

interface WebDeskStore extends WorkspaceState {
  // Ações de atalhos
  addShortcut: (shortcut: Omit<Shortcut, 'id' | 'createdAt'>) => void;
  updateShortcut: (id: string, updates: Partial<Shortcut>) => void;
  deleteShortcut: (id: string) => void;
  restoreShortcut: (trashId: string) => void;
  permanentlyDelete: (trashId: string) => void;
  emptyTrash: () => void;
  moveShortcutToFolder: (shortcutId: string, folderId: string | null) => void;
  updateShortcutPosition: (id: string, position: { x: number; y: number }) => void;
  togglePinTaskbar: (id: string) => void;
  togglePinStart: (id: string) => void;

  // Ações de pastas
  addFolder: (name: string, position?: { x: number; y: number }) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  updateFolderPosition: (id: string, position: { x: number; y: number }) => void;

  // Ações de janelas
  openWindow: (window: Omit<WindowState, 'id' | 'zIndex' | 'minimized' | 'maximized'>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;

  // Configurações
  setTheme: (theme: 'light' | 'dark') => void;
  setWallpaper: (wallpaper: string) => void;

  // Menu de contexto
  contextMenu: ContextMenuState;
  setContextMenu: (menu: ContextMenuState) => void;
  hideContextMenu: () => void;

  // Import/Export
  exportData: () => string;
  importData: (json: string) => boolean;
}

export const useStore = create<WebDeskStore>((set, get) => ({
  ...merged,

  contextMenu: { visible: false, x: 0, y: 0, type: 'desktop' },

  // === ATALHOS ===
  addShortcut: (shortcut) => {
    const newShortcut: Shortcut = {
      ...shortcut,
      id: generateId(),
      createdAt: Date.now(),
    };
    set((state) => {
      // Auto-assign position if not set or at origin
      if (!newShortcut.position || (newShortcut.position.x === 0 && newShortcut.position.y === 0)) {
        const occupied = new Set<string>();
        state.shortcuts.forEach((s) => {
          if (s.position && !s.folderId) occupied.add(`${s.position.x},${s.position.y}`);
        });
        state.folders.forEach((f) => {
          if (f.position) occupied.add(`${f.position.x},${f.position.y}`);
        });
        const cols = Math.max(1, Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1200) - 40) / 90);
        for (let y = 0; y < 100; y++) {
          for (let x = 0; x < cols; x++) {
            if (!occupied.has(`${x},${y}`)) {
              newShortcut.position = { x, y };
              break;
            }
          }
          if (newShortcut.position) break;
        }
      }
      const shortcuts = [...state.shortcuts, newShortcut];
      const newState = { ...state, shortcuts };
      saveState(newState);
      return newState;
    });
  },

  updateShortcut: (id, updates) => {
    set((state) => {
      const shortcuts = state.shortcuts.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      const newState = { ...state, shortcuts };
      saveState(newState);
      return newState;
    });
  },

  deleteShortcut: (id) => {
    set((state) => {
      const shortcut = state.shortcuts.find((s) => s.id === id);
      if (!shortcut) return state;
      const trashItem: TrashItem = {
        id: generateId(),
        shortcut: { ...shortcut },
        deletedAt: Date.now(),
      };
      const shortcuts = state.shortcuts.filter((s) => s.id !== id);
      const trash = [...state.trash, trashItem];
      const windows = state.windows.filter((w) => w.shortcutId !== id);
      const newState = { ...state, shortcuts, trash, windows };
      saveState(newState);
      return newState;
    });
  },

  restoreShortcut: (trashId) => {
    set((state) => {
      const item = state.trash.find((t) => t.id === trashId);
      if (!item) return state;
      const shortcuts = [...state.shortcuts, item.shortcut];
      const trash = state.trash.filter((t) => t.id !== trashId);
      const newState = { ...state, shortcuts, trash };
      saveState(newState);
      return newState;
    });
  },

  permanentlyDelete: (trashId) => {
    set((state) => {
      const trash = state.trash.filter((t) => t.id !== trashId);
      const newState = { ...state, trash };
      saveState(newState);
      return newState;
    });
  },

  emptyTrash: () => {
    set((state) => {
      const newState = { ...state, trash: [] };
      saveState(newState);
      return newState;
    });
  },

  moveShortcutToFolder: (shortcutId, folderId) => {
    set((state) => {
      const shortcuts = state.shortcuts.map((s) =>
        s.id === shortcutId ? { ...s, folderId } : s
      );
      const newState = { ...state, shortcuts };
      saveState(newState);
      return newState;
    });
  },

  updateShortcutPosition: (id, position) => {
    set((state) => {
      const shortcuts = state.shortcuts.map((s) =>
        s.id === id ? { ...s, position } : s
      );
      const newState = { ...state, shortcuts };
      saveState(newState);
      return newState;
    });
  },

  togglePinTaskbar: (id) => {
    set((state) => {
      const shortcuts = state.shortcuts.map((s) =>
        s.id === id ? { ...s, pinnedTaskbar: !s.pinnedTaskbar } : s
      );
      const newState = { ...state, shortcuts };
      saveState(newState);
      return newState;
    });
  },

  togglePinStart: (id) => {
    set((state) => {
      const shortcuts = state.shortcuts.map((s) =>
        s.id === id ? { ...s, pinnedStart: !s.pinnedStart } : s
      );
      const newState = { ...state, shortcuts };
      saveState(newState);
      return newState;
    });
  },

  // === PASTAS ===
  addFolder: (name, position) => {
    const folder: Folder = {
      id: generateId(),
      name,
      icon: '📁',
      position: position || { x: 0, y: 0 },
      createdAt: Date.now(),
    };
    set((state) => {
      const folders = [...state.folders, folder];
      const newState = { ...state, folders };
      saveState(newState);
      return newState;
    });
  },

  updateFolder: (id, updates) => {
    set((state) => {
      const folders = state.folders.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      );
      const newState = { ...state, folders };
      saveState(newState);
      return newState;
    });
  },

  deleteFolder: (id) => {
    set((state) => {
      // Move shortcuts da pasta para a área de trabalho
      const shortcuts = state.shortcuts.map((s) =>
        s.folderId === id ? { ...s, folderId: null } : s
      );
      const folders = state.folders.filter((f) => f.id !== id);
      const windows = state.windows.filter((w) => w.folderId !== id);
      const newState = { ...state, shortcuts, folders, windows };
      saveState(newState);
      return newState;
    });
  },

  updateFolderPosition: (id, position) => {
    set((state) => {
      const folders = state.folders.map((f) =>
        f.id === id ? { ...f, position } : f
      );
      const newState = { ...state, folders };
      saveState(newState);
      return newState;
    });
  },

  // === JANELAS ===
  openWindow: (windowData) => {
    set((state) => {
      const nextZ = state.nextZIndex + 1;
      const newWindow: WindowState = {
        ...windowData,
        id: generateId(),
        minimized: false,
        maximized: false,
        zIndex: nextZ,
      };
      const windows = [...state.windows, newWindow];
      const newState = { ...state, windows, nextZIndex: nextZ };
      return newState;
    });
  },

  closeWindow: (id) => {
    set((state) => {
      const windows = state.windows.filter((w) => w.id !== id);
      return { ...state, windows };
    });
  },

  minimizeWindow: (id) => {
    set((state) => {
      const windows = state.windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w
      );
      return { ...state, windows };
    });
  },

  maximizeWindow: (id) => {
    set((state) => {
      const windows = state.windows.map((w) =>
        w.id === id ? { ...w, maximized: true, minimized: false } : w
      );
      return { ...state, windows };
    });
  },

  restoreWindow: (id) => {
    set((state) => {
      const nextZ = state.nextZIndex + 1;
      const windows = state.windows.map((w) =>
        w.id === id ? { ...w, minimized: false, zIndex: nextZ } : w
      );
      return { ...state, windows, nextZIndex: nextZ };
    });
  },

  focusWindow: (id) => {
    set((state) => {
      const nextZ = state.nextZIndex + 1;
      const windows = state.windows.map((w) =>
        w.id === id ? { ...w, zIndex: nextZ, minimized: false } : w
      );
      return { ...state, windows, nextZIndex: nextZ };
    });
  },

  updateWindowPosition: (id, x, y) => {
    set((state) => {
      const windows = state.windows.map((w) =>
        w.id === id ? { ...w, x, y } : w
      );
      return { ...state, windows };
    });
  },

  updateWindowSize: (id, width, height) => {
    set((state) => {
      const windows = state.windows.map((w) =>
        w.id === id ? { ...w, width, height } : w
      );
      return { ...state, windows };
    });
  },

  // === CONFIGURAÇÕES ===
  setTheme: (theme) => {
    set((state) => {
      const newState = { ...state, theme };
      saveState(newState);
      return newState;
    });
  },

  setWallpaper: (wallpaper) => {
    set((state) => {
      const newState = { ...state, wallpaper };
      saveState(newState);
      return newState;
    });
  },

  // === MENU DE CONTEXTO ===
  setContextMenu: (menu) => set({ contextMenu: menu }),
  hideContextMenu: () =>
    set({ contextMenu: { visible: false, x: 0, y: 0, type: 'desktop' } }),

  // === IMPORT/EXPORT ===
  exportData: () => {
    const state = get();
    const data = {
      shortcuts: state.shortcuts,
      folders: state.folders,
      trash: state.trash,
      theme: state.theme,
      wallpaper: state.wallpaper,
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (json) => {
    try {
      const data = JSON.parse(json);
      set((state) => {
        const newState = {
          ...state,
          shortcuts: data.shortcuts || [],
          folders: data.folders || [],
          trash: data.trash || [],
          theme: data.theme || 'dark',
          wallpaper: data.wallpaper || WALLPAPERS[0],
        };
        saveState(newState);
        return newState;
      });
      return true;
    } catch {
      return false;
    }
  },
}));
