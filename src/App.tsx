import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from './store';
import {
  Shortcut,
  Folder,
  WindowState,
  ContextMenuState,
  WALLPAPERS,
  DEFAULT_CATEGORIES,
} from './types';
import {
  Monitor,
  Settings,
  Trash2,
  Search,
  Plus,
  FolderPlus,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Download,
  Upload,
  RotateCcw,
  Trash,
  Edit3,
  Pin,
  PinOff,
  FolderOpen,
  ExternalLink,
  Sun,
  Moon,
  Image,
  Palette,
  Info,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';

// ========== COMPONENTE PRINCIPAL ==========
export default function App() {
  const { theme, wallpaper } = useStore();

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div
      className={`webdesk-root ${theme}`}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
    >
      {/* Wallpaper */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: wallpaper }}
      />
      {/* Desktop */}
      <Desktop />
      {/* Windows */}
      <WindowManager />
      {/* Taskbar */}
      <Taskbar />
      {/* Context Menu */}
      <ContextMenu />
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

// ========== TOAST ==========
let toastId = 0;
const toasts: { id: number; message: string; type: 'success' | 'error' | 'info' }[] = [];
let toastListeners: (() => void)[] = [];

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = ++toastId;
  toasts.push({ id, message, type });
  toastListeners.forEach((l) => l());
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx >= 0) toasts.splice(idx, 1);
    toastListeners.forEach((l) => l());
  }, 3000);
}

function ToastContainer() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-sm animate-slide-in ${
            t.type === 'success'
              ? 'bg-green-500 text-white'
              : t.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ========== DESKTOP ==========
function Desktop() {
  const { shortcuts, folders, hideContextMenu, setContextMenu } = useStore();
  const desktopRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<{ id: string; type: 'shortcut' | 'folder' } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  // Atalhos na área de trabalho (não em pastas)
  const desktopShortcuts = shortcuts.filter((s) => s.folderId === null || s.folderId === undefined);
  const desktopFolders = folders;

  // Grid size
  const GRID_SIZE = 90;
  const GRID_COLS = Math.max(1, Math.floor((window.innerWidth - 40) / GRID_SIZE));

  const getNextPosition = useCallback(() => {
    const occupied = new Set<string>();
    desktopShortcuts.forEach((s) => {
      if (s.position) occupied.add(`${s.position.x},${s.position.y}`);
    });
    desktopFolders.forEach((f) => {
      if (f.position) occupied.add(`${f.position.x},${f.position.y}`);
    });
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (!occupied.has(`${x},${y}`)) return { x, y };
      }
    }
    return { x: 0, y: 0 };
  }, [desktopShortcuts, desktopFolders, GRID_COLS]);

  // Handle right-click on desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'desktop',
    });
  };

  // Handle click on empty area
  const handleClick = (e: React.MouseEvent) => {
    if (e.target === desktopRef.current) {
      setSelectedId(null);
      hideContextMenu();
    }
  };

  // Handle double-click on empty area
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === desktopRef.current) {
      // Could open new shortcut dialog
    }
  };

  // Drag handlers
  const handleDragStart = (id: string, type: 'shortcut' | 'folder') => {
    setDragItem({ id, type });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragItem) return;
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);
    const pos = { x: Math.max(0, x), y: Math.max(0, y) };

    if (dragItem.type === 'shortcut') {
      useStore.getState().updateShortcutPosition(dragItem.id, pos);
    } else {
      useStore.getState().updateFolderPosition(dragItem.id, pos);
    }
    setDragItem(null);
    setDragPos(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={desktopRef}
      className="absolute inset-0 bottom-[48px] z-[1] overflow-hidden"
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Ícones na área de trabalho */}
      <div className="p-3 flex flex-col flex-wrap gap-1 h-full content-start">
        {desktopFolders.map((folder) => (
          <DesktopIcon
            key={folder.id}
            item={folder}
            type="folder"
            selected={selectedId === folder.id}
            onSelect={() => setSelectedId(folder.id)}
            onDragStart={() => handleDragStart(folder.id, 'folder')}
            gridSize={GRID_SIZE}
          />
        ))}
        {desktopShortcuts.map((shortcut) => (
          <DesktopIcon
            key={shortcut.id}
            item={shortcut}
            type="shortcut"
            selected={selectedId === shortcut.id}
            onSelect={() => setSelectedId(shortcut.id)}
            onDragStart={() => handleDragStart(shortcut.id, 'shortcut')}
            gridSize={GRID_SIZE}
          />
        ))}
      </div>
    </div>
  );
}

// ========== DESKTOP ICON ==========
function DesktopIcon({
  item,
  type,
  selected,
  onSelect,
  onDragStart,
  gridSize,
}: {
  item: Shortcut | Folder;
  type: 'shortcut' | 'folder';
  selected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  gridSize: number;
}) {
  const { setContextMenu, openWindow, deleteShortcut, deleteFolder, updateShortcut, updateFolder } = useStore();
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  const handleDoubleClick = () => {
    if (type === 'shortcut') {
      const shortcut = item as Shortcut;
      openWindow({
        title: shortcut.name,
        icon: shortcut.icon,
        type: 'shortcut',
        shortcutId: shortcut.id,
        x: 100 + Math.random() * 100,
        y: 50 + Math.random() * 50,
        width: Math.min(900, window.innerWidth - 100),
        height: Math.min(600, window.innerHeight - 150),
      });
    } else {
      const folder = item as Folder;
      openWindow({
        title: folder.name,
        icon: folder.icon,
        type: 'folder',
        folderId: folder.id,
        x: 150 + Math.random() * 100,
        y: 80 + Math.random() * 50,
        width: Math.min(700, window.innerWidth - 100),
        height: Math.min(500, window.innerHeight - 150),
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: type,
      targetId: item.id,
    });
  };

  const handleRename = () => {
    if (renameValue.trim()) {
      if (type === 'shortcut') {
        updateShortcut(item.id, { name: renameValue.trim() });
      } else {
        updateFolder(item.id, { name: renameValue.trim() });
      }
    }
    setRenaming(false);
  };

  const isEmoji = (str: string) => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u;
    return emojiRegex.test(str);
  };

  const renderIcon = () => {
    if (type === 'folder') {
      return <span className="text-4xl">{(item as Folder).icon}</span>;
    }
    const shortcut = item as Shortcut;
    if (shortcut.iconType === 'image') {
      return (
        <img
          src={shortcut.icon}
          alt={shortcut.name}
          className="w-10 h-10 rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    if (shortcut.iconType === 'color') {
      return (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: shortcut.color || '#6366f1' }}
        >
          {shortcut.name.charAt(0).toUpperCase()}
        </div>
      );
    }
    return <span className="text-4xl">{shortcut.icon}</span>;
  };

  return (
    <div
      className={`desktop-icon flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer select-none transition-all duration-150 group
        ${selected ? 'bg-white/20 ring-1 ring-white/40' : 'hover:bg-white/10'}
      `}
      style={{ width: gridSize - 8, height: gridSize - 8 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
    >
      <div className="transition-transform group-hover:scale-110">
        {renderIcon()}
      </div>
      {renaming ? (
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') setRenaming(false);
          }}
          className="mt-1 text-xs text-center bg-white/90 text-gray-900 rounded px-1 w-full outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="mt-1 text-xs text-white text-center leading-tight drop-shadow-md truncate w-full px-1">
          {item.name}
        </span>
      )}
    </div>
  );
}

// ========== WINDOW MANAGER ==========
function WindowManager() {
  const { windows } = useStore();

  return (
    <div className="absolute inset-0 bottom-[48px] z-[100] pointer-events-none">
      {windows.map((win) => (
        <Window key={win.id} window={win} />
      ))}
    </div>
  );
}

// ========== WINDOW ==========
function Window({ window: win }: { window: WindowState }) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowPosition, updateWindowSize } = useStore();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, winX: 0, winY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls')) return;
    focusWindow(win.id);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, winX: win.x, winY: win.y };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        updateWindowPosition(win.id, dragStart.current.winX + dx, dragStart.current.winY + dy);
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const newW = Math.max(300, resizeStart.current.w + dx);
        const newH = Math.max(200, resizeStart.current.h + dy);
        updateWindowSize(win.id, newW, newH);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, win.id]);

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 48px)', zIndex: win.zIndex }
    : { top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      ref={windowRef}
      className={`absolute window-container rounded-lg overflow-hidden shadow-2xl flex flex-col transition-shadow pointer-events-auto
        ${win.maximized ? '' : 'border border-gray-300/30'}
        dark:border-gray-600/50
      `}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center h-9 px-3 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-gray-700 dark:to-gray-600 select-none cursor-move shrink-0"
        onMouseDown={handleMouseDown}
        onDoubleClick={() => maximizeWindow(win.id)}
      >
        <span className="text-sm mr-2">{win.icon}</span>
        <span className="text-sm text-white font-medium truncate flex-1">{win.title}</span>
        <div className="window-controls flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white transition-colors"
            aria-label="Minimizar"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white transition-colors"
            aria-label="Maximizar"
          >
            {win.maximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500 text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800">
        <WindowContent window={win} />
      </div>

      {/* Resize handle */}
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            resizeStart.current = { x: e.clientX, y: e.clientY, w: win.width, h: win.height };
          }}
        />
      )}
    </div>
  );
}

// ========== WINDOW CONTENT ==========
function WindowContent({ window: win }: { window: WindowState }) {
  switch (win.type) {
    case 'shortcut':
      return <ShortcutContent shortcutId={win.shortcutId!} />;
    case 'folder':
      return <FolderContent folderId={win.folderId!} />;
    case 'settings':
      return <SettingsContent />;
    case 'trash':
      return <TrashContent />;
    case 'about':
      return <AboutContent />;
    default:
      return <div className="p-4">Conteúdo desconhecido</div>;
  }
}

// ========== SHORTCUT CONTENT (iframe) ==========
function ShortcutContent({ shortcutId }: { shortcutId: string }) {
  const { shortcuts } = useStore();
  const shortcut = shortcuts.find((s) => s.id === shortcutId);
  const [iframeError, setIframeError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!shortcut) return <div className="p-4 text-gray-500">Atalho não encontrado</div>;

  if (iframeError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <AlertTriangle size={48} className="text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Este site não pode ser exibido em iframe
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          O site "{shortcut.name}" bloqueia a incorporação em iframes por questões de segurança.
        </p>
        <a
          href={shortcut.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <ExternalLink size={16} />
          Abrir em nova aba
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
      <iframe
        src={shortcut.url}
        className="w-full h-full border-0"
        title={shortcut.name}
        onLoad={() => setLoading(false)}
        onError={() => { setIframeError(true); setLoading(false); }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
      {/* Fallback: se o iframe carregar mas o conteúdo for bloqueado */}
      {loading && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => { setIframeError(true); setLoading(false); }}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 underline"
          >
            Não carregou? Clique aqui
          </button>
        </div>
      )}
    </div>
  );
}

// ========== FOLDER CONTENT ==========
function FolderContent({ folderId }: { folderId: string }) {
  const { shortcuts, folders } = useStore();
  const folder = folders.find((f) => f.id === folderId);
  const folderShortcuts = shortcuts.filter((s) => s.folderId === folderId);
  const { openWindow, moveShortcutToFolder } = useStore();

  if (!folder) return <div className="p-4 text-gray-500">Pasta não encontrada</div>;

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {folderShortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
            onDoubleClick={() => {
              openWindow({
                title: shortcut.name,
                icon: shortcut.icon,
                type: 'shortcut',
                shortcutId: shortcut.id,
                x: 100 + Math.random() * 100,
                y: 50 + Math.random() * 50,
                width: Math.min(900, window.innerWidth - 100),
                height: Math.min(600, window.innerHeight - 150),
              });
            }}
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{shortcut.icon}</span>
            <span className="mt-1 text-xs text-center text-gray-700 dark:text-gray-300 truncate w-full">
              {shortcut.name}
            </span>
          </div>
        ))}
        {folderShortcuts.length === 0 && (
          <div className="col-span-full text-center text-gray-400 dark:text-gray-500 py-8">
            <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
            <p>Pasta vazia</p>
            <p className="text-xs mt-1">Arraste atalhos para cá ou crie novos</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== SETTINGS CONTENT ==========
function SettingsContent() {
  const { theme, setTheme, wallpaper, setWallpaper, exportData, importData, shortcuts, folders, trash } = useStore();
  const [customWallpaper, setCustomWallpaper] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webdesk-config.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Configuração exportada com sucesso!', 'success');
  };

  const handleImport = () => {
    const success = importData(importText);
    if (success) {
      showToast('Configuração importada com sucesso!', 'success');
      setShowImport(false);
      setImportText('');
    } else {
      showToast('Erro ao importar: JSON inválido', 'error');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const success = importData(text);
      if (success) {
        showToast('Configuração importada com sucesso!', 'success');
      } else {
        showToast('Erro ao importar: arquivo inválido', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setWallpaper(`url(${url}) center/cover no-repeat`);
      showToast('Papel de parede personalizado aplicado!', 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Configurações</h2>

      {/* Tema */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">Tema</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <Sun size={18} /> Claro
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <Moon size={18} /> Escuro
          </button>
        </div>
      </section>

      {/* Papel de Parede */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
          Papel de Parede
        </h3>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {WALLPAPERS.map((wp, i) => (
            <button
              key={i}
              onClick={() => setWallpaper(wp)}
              className={`w-full aspect-video rounded-lg border-2 transition-all hover:scale-105 ${
                wallpaper === wp ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent'
              }`}
              style={{ background: wp }}
              aria-label={`Papel de parede ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Image size={16} />
            <span className="text-sm">Upload de imagem</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
          </label>
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-gray-500" />
            <input
              type="color"
              value={customWallpaper || '#1e3a5f'}
              onChange={(e) => setCustomWallpaper(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <button
              onClick={() => setWallpaper(customWallpaper)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Aplicar cor
            </button>
          </div>
        </div>
      </section>

      {/* Dados */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
          Dados
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download size={16} /> Exportar JSON
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Upload size={16} /> Importar JSON
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer">
            <Upload size={16} /> Importar arquivo
            <input type="file" accept=".json" className="hidden" onChange={handleFileImport} />
          </label>
        </div>
        {showImport && (
          <div className="mt-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole o JSON aqui..."
              className="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono resize-none"
            />
            <button
              onClick={handleImport}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Importar
            </button>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>📊 {shortcuts.length} atalhos | 📁 {folders.length} pastas | 🗑️ {trash.length} na lixeira</p>
        </div>
      </section>
    </div>
  );
}

// ========== TRASH CONTENT ==========
function TrashContent() {
  const { trash, restoreShortcut, permanentlyDelete, emptyTrash } = useStore();

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Lixeira</h2>
        {trash.length > 0 && (
          <button
            onClick={() => { emptyTrash(); showToast('Lixeira esvaziada', 'info'); }}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Esvaziar lixeira
          </button>
        )}
      </div>

      {trash.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-12">
          <Trash2 size={48} className="mx-auto mb-3 opacity-50" />
          <p>A lixeira está vazia</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trash.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.shortcut.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.shortcut.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Excluído em {new Date(item.deletedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { restoreShortcut(item.id); showToast('Atalho restaurado!', 'success'); }}
                  className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                  aria-label="Restaurar"
                  title="Restaurar"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => { permanentlyDelete(item.id); showToast('Excluído permanentemente', 'info'); }}
                  className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                  aria-label="Excluir permanentemente"
                  title="Excluir permanentemente"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== ABOUT CONTENT ==========
function AboutContent() {
  return (
    <div className="p-8 h-full overflow-auto flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4">🖥️</div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">WebDesk</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">Sua Área de Trabalho na Web</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        Um ambiente de desktop completo no navegador. Organize seus atalhos, crie pastas,
        personalize o visual e tenha tudo ao seu alcance.
      </p>
      <div className="mt-6 text-xs text-gray-400 dark:text-gray-500">
        <p>Versão 1.0.0 • Feito com React + TypeScript + Tailwind CSS</p>
        <p className="mt-1">Dados salvos localmente no navegador</p>
      </div>
    </div>
  );
}

// ========== TASKBAR ==========
function Taskbar() {
  const { windows, openWindow, setTheme, theme } = useStore();
  const [startOpen, setStartOpen] = useState(false);
  const [showNewShortcut, setShowNewShortcut] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenSettings = () => {
    openWindow({
      title: 'Configurações',
      icon: '⚙️',
      type: 'settings',
      x: 200,
      y: 100,
      width: 600,
      height: 500,
    });
    setStartOpen(false);
  };

  const handleOpenTrash = () => {
    openWindow({
      title: 'Lixeira',
      icon: '🗑️',
      type: 'trash',
      x: 250,
      y: 120,
      width: 500,
      height: 400,
    });
    setStartOpen(false);
  };

  const handleOpenAbout = () => {
    openWindow({
      title: 'Sobre o WebDesk',
      icon: '🖥️',
      type: 'about',
      x: 300,
      y: 150,
      width: 450,
      height: 350,
    });
    setStartOpen(false);
  };

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-700/50 z-[9999] flex items-center px-2 gap-1">
        {/* Start Button */}
        <button
          onClick={() => setStartOpen(!startOpen)}
          className={`h-9 px-3 rounded flex items-center gap-2 transition-colors ${
            startOpen ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
          aria-label="Menu Iniciar"
        >
          <Monitor size={18} className="text-blue-400" />
          <span className="text-sm text-white font-medium hidden sm:inline">Iniciar</span>
        </button>

        {/* New Shortcut Button */}
        <button
          onClick={() => setShowNewShortcut(true)}
          className="h-9 px-2 rounded flex items-center gap-1 hover:bg-white/10 transition-colors"
          aria-label="Novo atalho"
          title="Novo atalho"
        >
          <Plus size={16} className="text-green-400" />
          <span className="text-xs text-white hidden sm:inline">Novo</span>
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Pinned shortcuts */}
        <TaskbarPinned />

        {/* Open windows */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto px-1">
          {windows.map((win) => (
            <TaskbarWindowButton key={win.id} window={win} />
          ))}
        </div>

        {/* System tray */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-300 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={handleOpenSettings}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-300 transition-colors"
            aria-label="Configurações"
          >
            <Settings size={16} />
          </button>
          <div className="text-right px-2">
            <div className="text-xs text-white leading-tight">
              {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-[10px] text-gray-400 leading-tight">
              {time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Start Menu */}
      {startOpen && <StartMenu onClose={() => setStartOpen(false)} onOpenSettings={handleOpenSettings} onOpenTrash={handleOpenTrash} onOpenAbout={handleOpenAbout} />}

      {/* New Shortcut Modal */}
      {showNewShortcut && (
        <ShortcutFormModal
          onClose={() => setShowNewShortcut(false)}
          onSave={(data) => {
            useStore.getState().addShortcut(data);
            setShowNewShortcut(false);
            showToast('Atalho criado com sucesso!', 'success');
          }}
        />
      )}
    </>
  );
}

// ========== TASKBAR PINNED ==========
function TaskbarPinned() {
  const { shortcuts, openWindow, windows } = useStore();
  const pinned = shortcuts.filter((s) => s.pinnedTaskbar && !s.folderId);

  return (
    <div className="flex items-center gap-1">
      {pinned.map((shortcut) => {
        const isOpen = windows.some((w) => w.shortcutId === shortcut.id);
        return (
          <button
            key={shortcut.id}
            onClick={() => {
              const existing = windows.find((w) => w.shortcutId === shortcut.id);
              if (existing) {
                if (existing.minimized) {
                  useStore.getState().restoreWindow(existing.id);
                } else {
                  useStore.getState().focusWindow(existing.id);
                }
              } else {
                openWindow({
                  title: shortcut.name,
                  icon: shortcut.icon,
                  type: 'shortcut',
                  shortcutId: shortcut.id,
                  x: 100 + Math.random() * 100,
                  y: 50 + Math.random() * 50,
                  width: Math.min(900, window.innerWidth - 100),
                  height: Math.min(600, window.innerHeight - 150),
                });
              }
            }}
            className={`h-9 px-2 rounded flex items-center gap-1 transition-colors relative ${
              isOpen ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            title={shortcut.name}
          >
            <span className="text-lg">{shortcut.icon}</span>
            {isOpen && (
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-400 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ========== TASKBAR WINDOW BUTTON ==========
function TaskbarWindowButton({ window: win }: { window: WindowState }) {
  const { focusWindow, minimizeWindow, restoreWindow } = useStore();

  return (
    <button
      onClick={() => {
        if (win.minimized) {
          restoreWindow(win.id);
        } else {
          // Se já está focada, minimiza. Senão, foca.
          const allWindows = useStore.getState().windows;
          const maxZ = Math.max(...allWindows.map((w) => w.zIndex));
          if (win.zIndex === maxZ) {
            minimizeWindow(win.id);
          } else {
            focusWindow(win.id);
          }
        }
      }}
      className={`h-9 px-3 rounded flex items-center gap-1.5 transition-colors max-w-[160px] ${
        win.minimized ? 'bg-white/5 hover:bg-white/10' : 'bg-white/15 hover:bg-white/20'
      }`}
      title={win.title}
    >
      <span className="text-sm truncate">{win.icon}</span>
      <span className="text-xs text-white truncate hidden sm:inline">{win.title}</span>
    </button>
  );
}

// ========== START MENU ==========
function StartMenu({
  onClose,
  onOpenSettings,
  onOpenTrash,
  onOpenAbout,
}: {
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenTrash: () => void;
  onOpenAbout: () => void;
}) {
  const { shortcuts, folders, openWindow } = useStore();
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const desktopShortcuts = shortcuts.filter((s) => !s.folderId);
  const pinnedShortcuts = desktopShortcuts.filter((s) => s.pinnedStart);
  const filteredShortcuts = search
    ? desktopShortcuts.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];
  const filteredFolders = search
    ? folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const openShortcut = (shortcut: Shortcut) => {
    openWindow({
      title: shortcut.name,
      icon: shortcut.icon,
      type: 'shortcut',
      shortcutId: shortcut.id,
      x: 100 + Math.random() * 100,
      y: 50 + Math.random() * 50,
      width: Math.min(900, window.innerWidth - 100),
      height: Math.min(600, window.innerHeight - 150),
    });
    onClose();
  };

  const openFolder = (folder: Folder) => {
    openWindow({
      title: folder.name,
      icon: folder.icon,
      type: 'folder',
      folderId: folder.id,
      x: 150 + Math.random() * 100,
      y: 80 + Math.random() * 50,
      width: Math.min(700, window.innerWidth - 100),
      height: Math.min(500, window.innerHeight - 150),
    });
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute bottom-12 left-0 sm:left-2 w-full sm:w-[420px] max-h-[70vh] bg-gray-900/98 dark:bg-gray-800/98 backdrop-blur-xl rounded-t-xl sm:rounded-xl border border-gray-700/50 z-[10000] shadow-2xl overflow-hidden animate-slide-up"
    >
      {/* Search */}
      <div className="p-3 border-b border-gray-700/50">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar atalhos e pastas..."
            className="w-full pl-9 pr-3 py-2 bg-gray-700/50 text-white rounded-lg text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-3">
        {/* Search results */}
        {search && (
          <div className="mb-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">Resultados</h3>
            {filteredFolders.map((f) => (
              <button
                key={f.id}
                onClick={() => openFolder(f)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm text-white">{f.name}</span>
                <span className="text-xs text-gray-400 ml-auto">Pasta</span>
              </button>
            ))}
            {filteredShortcuts.map((s) => (
              <button
                key={s.id}
                onClick={() => openShortcut(s)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm text-white">{s.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{s.category}</span>
              </button>
            ))}
            {filteredShortcuts.length === 0 && filteredFolders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum resultado encontrado</p>
            )}
          </div>
        )}

        {/* Pinned */}
        {!search && pinnedShortcuts.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">Fixados</h3>
            <div className="grid grid-cols-4 gap-2">
              {pinnedShortcuts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openShortcut(s)}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-[10px] text-gray-300 text-center mt-1 truncate w-full">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All shortcuts */}
        {!search && (
          <div className="mb-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">Todos os atalhos</h3>
            {desktopShortcuts.map((s) => (
              <button
                key={s.id}
                onClick={() => openShortcut(s)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm text-white">{s.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{s.category}</span>
              </button>
            ))}
          </div>
        )}

        {/* System */}
        <div className="border-t border-gray-700/50 pt-3 mt-3">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <Settings size={18} className="text-gray-300" />
            <span className="text-sm text-white">Configurações</span>
          </button>
          <button
            onClick={onOpenTrash}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <Trash2 size={18} className="text-gray-300" />
            <span className="text-sm text-white">Lixeira</span>
          </button>
          <button
            onClick={onOpenAbout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <Info size={18} className="text-gray-300" />
            <span className="text-sm text-white">Sobre</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== CONTEXT MENU ==========
function ContextMenu() {
  const { contextMenu, hideContextMenu, addShortcut, addFolder, deleteShortcut, deleteFolder, updateShortcut, togglePinTaskbar, togglePinStart, shortcuts, folders } = useStore();
  const [showNewShortcut, setShowNewShortcut] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu.visible) return;
    // Use mousedown instead of click to avoid conflicts with contextmenu event
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideContextMenu();
    };
    // Delay adding listener to avoid closing immediately
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleEsc);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu.visible]);

  if (!contextMenu.visible) return null;

  const targetShortcut = contextMenu.targetId
    ? shortcuts.find((s) => s.id === contextMenu.targetId)
    : null;
  const targetFolder = contextMenu.targetId
    ? folders.find((f) => f.id === contextMenu.targetId)
    : null;

  // Adjust position to stay within viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(contextMenu.y, window.innerHeight - 300),
    left: Math.min(contextMenu.x, window.innerWidth - 220),
    zIndex: 99999,
  };

  return (
    <>
      <div
        ref={menuRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 min-w-[200px] animate-fade-in"
        style={menuStyle}
      >
        {contextMenu.type === 'desktop' && (
          <>
            <MenuItem icon={<Plus size={14} />} label="Novo atalho" onClick={() => { setShowNewShortcut(true); hideContextMenu(); }} />
            <MenuItem icon={<FolderPlus size={14} />} label="Nova pasta" onClick={() => { setShowNewFolder(true); hideContextMenu(); }} />
            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
            <MenuItem icon={<Settings size={14} />} label="Configurações" onClick={() => {
              useStore.getState().openWindow({
                title: 'Configurações',
                icon: '⚙️',
                type: 'settings',
                x: 200,
                y: 100,
                width: 600,
                height: 500,
              });
              hideContextMenu();
            }} />
            <MenuItem icon={<Trash2 size={14} />} label="Lixeira" onClick={() => {
              useStore.getState().openWindow({
                title: 'Lixeira',
                icon: '🗑️',
                type: 'trash',
                x: 250,
                y: 120,
                width: 500,
                height: 400,
              });
              hideContextMenu();
            }} />
          </>
        )}

        {contextMenu.type === 'shortcut' && targetShortcut && (
          <>
            <MenuItem icon={<Edit3 size={14} />} label="Renomear" onClick={() => { setEditingShortcut(targetShortcut); hideContextMenu(); }} />
            <MenuItem
              icon={targetShortcut.pinnedTaskbar ? <PinOff size={14} /> : <Pin size={14} />}
              label={targetShortcut.pinnedTaskbar ? 'Desafixar da barra' : 'Fixar na barra'}
              onClick={() => { togglePinTaskbar(targetShortcut.id); hideContextMenu(); }}
            />
            <MenuItem
              icon={targetShortcut.pinnedStart ? <PinOff size={14} /> : <Pin size={14} />}
              label={targetShortcut.pinnedStart ? 'Desafixar do início' : 'Fixar no início'}
              onClick={() => { togglePinStart(targetShortcut.id); hideContextMenu(); }}
            />
            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
            <MenuItem icon={<Trash2 size={14} />} label="Excluir" onClick={() => { deleteShortcut(targetShortcut.id); hideContextMenu(); showToast('Movido para a lixeira', 'info'); }} danger />
          </>
        )}

        {contextMenu.type === 'folder' && targetFolder && (
          <>
            <MenuItem icon={<Edit3 size={14} />} label="Renomear" onClick={() => {
              const newName = prompt('Novo nome da pasta:', targetFolder.name);
              if (newName?.trim()) {
                useStore.getState().updateFolder(targetFolder.id, { name: newName.trim() });
              }
              hideContextMenu();
            }} />
            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
            <MenuItem icon={<Trash2 size={14} />} label="Excluir pasta" onClick={() => { deleteFolder(targetFolder.id); hideContextMenu(); showToast('Pasta excluída (atalhos movidos para a área de trabalho)', 'info'); }} danger />
          </>
        )}
      </div>

      {/* Modals */}
      {showNewShortcut && (
        <ShortcutFormModal
          onClose={() => setShowNewShortcut(false)}
          onSave={(data) => { addShortcut(data); setShowNewShortcut(false); showToast('Atalho criado!', 'success'); }}
        />
      )}
      {editingShortcut && (
        <ShortcutFormModal
          shortcut={editingShortcut}
          onClose={() => setEditingShortcut(null)}
          onSave={(data) => { updateShortcut(editingShortcut.id, data); setEditingShortcut(null); showToast('Atalho atualizado!', 'success'); }}
        />
      )}
      {showNewFolder && (
        <FolderFormModal
          onClose={() => setShowNewFolder(false)}
          onSave={(name) => { addFolder(name); setShowNewFolder(false); showToast('Pasta criada!', 'success'); }}
        />
      )}
    </>
  );
}

// ========== CONTEXT MENU ITEM ==========
function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
          : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ========== SHORTCUT FORM MODAL ==========
function ShortcutFormModal({
  shortcut,
  onClose,
  onSave,
}: {
  shortcut?: Shortcut;
  onClose: () => void;
  onSave: (data: Omit<Shortcut, 'id' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState(shortcut?.name || '');
  const [url, setUrl] = useState(shortcut?.url || '');
  const [iconType, setIconType] = useState<'emoji' | 'image' | 'color'>(shortcut?.iconType || 'emoji');
  const [emoji, setEmoji] = useState(shortcut?.iconType === 'emoji' ? shortcut.icon : '🌐');
  const [imageUrl, setImageUrl] = useState(shortcut?.iconType === 'image' ? shortcut.icon : '');
  const [color, setColor] = useState(shortcut?.color || '#6366f1');
  const [category, setCategory] = useState(shortcut?.category || 'Outros');

  const EMOJI_OPTIONS = ['🌐', '🔍', '📧', '💬', '🎵', '🎮', '📷', '🛒', '📰', '💻', '📚', '🎬', '🏠', '💼', '🔧', '📊', '🗂️', '🎨', '✈️', '🍕', '⚡', '🔒', '📱', '🖥️'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    let icon = emoji;
    if (iconType === 'image') icon = imageUrl;
    if (iconType === 'color') icon = color;

    onSave({
      name: name.trim(),
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
      icon,
      iconType,
      color: iconType === 'color' ? color : undefined,
      category,
      folderId: null,
      position: { x: 0, y: 0 },
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {shortcut ? 'Editar Atalho' : 'Novo Atalho'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Google"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Tipo de Ícone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ícone</label>
            <div className="flex gap-2 mb-3">
              {(['emoji', 'image', 'color'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIconType(type)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    iconType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {type === 'emoji' ? 'Emoji' : type === 'image' ? 'Imagem' : 'Cor'}
                </button>
              ))}
            </div>

            {iconType === 'emoji' && (
              <div className="grid grid-cols-8 gap-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg max-h-32 overflow-y-auto">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                      emoji === e ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {iconType === 'image' && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL da imagem (ex: https://...)"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {iconType === 'color' && (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500">{color}</span>
              </div>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {shortcut ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== FOLDER FORM MODAL ==========
function FolderFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Nova Pasta</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da pasta"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
