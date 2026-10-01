// Tipos principais do WebDesk

export interface Shortcut {
  id: string;
  name: string;
  url: string;
  icon: string; // emoji ou URL de imagem
  iconType: 'emoji' | 'image' | 'color';
  color?: string;
  category: string;
  folderId?: string | null; // null = na área de trabalho
  position?: { x: number; y: number }; // posição na grade
  pinnedTaskbar?: boolean;
  pinnedStart?: boolean;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  position?: { x: number; y: number };
  createdAt: number;
}

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  type: 'shortcut' | 'folder' | 'settings' | 'trash' | 'about';
  shortcutId?: string;
  folderId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

export interface TrashItem {
  id: string;
  shortcut: Shortcut;
  deletedAt: number;
}

export interface WorkspaceState {
  shortcuts: Shortcut[];
  folders: Folder[];
  windows: WindowState[];
  trash: TrashItem[];
  theme: 'light' | 'dark';
  wallpaper: string; // URL ou 'color:...' ou gradiente
  nextZIndex: number;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'desktop' | 'shortcut' | 'folder' | 'taskbar';
  targetId?: string;
}

// Papéis de parede pré-definidos
export const WALLPAPERS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #0c3483 0%, #a2b6df 50%, #6b8cce 100%)',
  'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
];

// Categorias padrão
export const DEFAULT_CATEGORIES = [
  'Redes Sociais',
  'Produtividade',
  'Desenvolvimento',
  'Entretenimento',
  'Notícias',
  'Educação',
  'Compras',
  'Outros',
];

// Atalhos padrão para primeiro uso
export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'default-1',
    name: 'Google',
    url: 'https://www.google.com',
    icon: '🔍',
    iconType: 'emoji',
    category: 'Produtividade',
    folderId: null,
    position: { x: 0, y: 0 },
    pinnedStart: true,
    createdAt: Date.now(),
  },
  {
    id: 'default-2',
    name: 'YouTube',
    url: 'https://www.youtube.com',
    icon: '▶️',
    iconType: 'emoji',
    category: 'Entretenimento',
    folderId: null,
    position: { x: 0, y: 1 },
    pinnedStart: true,
    createdAt: Date.now(),
  },
  {
    id: 'default-3',
    name: 'GitHub',
    url: 'https://github.com',
    icon: '💻',
    iconType: 'emoji',
    category: 'Desenvolvimento',
    folderId: null,
    position: { x: 0, y: 2 },
    pinnedStart: true,
    createdAt: Date.now(),
  },
  {
    id: 'default-4',
    name: 'Wikipedia',
    url: 'https://pt.wikipedia.org',
    icon: '📚',
    iconType: 'emoji',
    category: 'Educação',
    folderId: null,
    position: { x: 0, y: 3 },
    createdAt: Date.now(),
  },
  {
    id: 'default-5',
    name: 'Reddit',
    url: 'https://www.reddit.com',
    icon: '🤖',
    iconType: 'emoji',
    category: 'Redes Sociais',
    folderId: null,
    position: { x: 0, y: 4 },
    createdAt: Date.now(),
  },
];
