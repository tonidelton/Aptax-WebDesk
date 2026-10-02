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

// Papéis de parede pré-definidos (estilo iOS)
export const WALLPAPERS = [
  // iOS 16 - Colorful swirls
  'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)',
  // iOS 17 - Blue/Purple
  'linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)',
  // iOS - Pink/Orange sunset
  'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 50%, #FF99AC 100%)',
  // iOS - Deep Blue
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4b79a1 100%)',
  // iOS - Purple Dream
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  // iOS - Green/Teal
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  // iOS - Cosmic
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  // iOS - Warm
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  // iOS - Ocean
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  // iOS - Aurora
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
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
