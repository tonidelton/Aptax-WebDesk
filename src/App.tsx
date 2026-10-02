import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from './store';
import {
  Shortcut,
  Folder,
  WindowState,
  WALLPAPERS,
  DEFAULT_CATEGORIES,
} from './types';
import {
  Search,
  Plus,
  X,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trash2,
  Pin,
  PinOff,
  ExternalLink,
  Sun,
  Moon,
  Image,
  Palette,
  AlertTriangle,
  Settings,
  Download,
  Upload,
  Edit3,
  FolderOpen,
  Wifi,
  Battery,
  Signal,
} from 'lucide-react';

// ========== TOAST SYSTEM ==========
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
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`ios-glass-heavy px-5 py-3 rounded-2xl shadow-lg text-sm font-medium animate-ios-toast pointer-events-auto
            ${t.type === 'success' ? 'text-green-600 dark:text-green-400' : ''}
            ${t.type === 'error' ? 'text-red-600 dark:text-red-400' : ''}
            ${t.type === 'info' ? 'text-blue-600 dark:text-blue-400' : ''}
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

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
      {/* Status Bar */}
      <StatusBar />
      {/* Desktop */}
      <Desktop />
      {/* Windows */}
      <WindowManager />
      {/* Dock */}
      <Dock />
      {/* Context Menu */}
      <ContextMenu />
      {/* Global Modals */}
      <GlobalModals />
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

// ========== STATUS BAR (iOS style) ==========
function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-11 z-[9998] flex items-center justify-between px-6 ios-status-bar text-white">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <span>{time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Signal size={14} className="opacity-90" />
        <Wifi size={15} className="opacity-90" />
        <Battery size={18} className="opacity-90" />
      </div>
    </div>
  );
}

// ========== DESKTOP ==========
function Desktop() {
  const { shortcuts, folders, hideContextMenu, setContextMenu } = useStore();
  const desktopRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<{ id: string; type: 'shortcut' | 'folder' } | null>(null);
  const [, setSpotlightTick] = useState(0);

  // Subscribe to global spotlight state
  useEffect(() => {
    const listener = () => setSpotlightTick((t) => t + 1);
    spotlightListeners.push(listener);
    return () => {
      spotlightListeners = spotlightListeners.filter((l) => l !== listener);
    };
  }, []);

  const desktopShortcuts = shortcuts.filter((s) => s.folderId === null || s.folderId === undefined);
  const desktopFolders = folders;

  const GRID_SIZE = 90;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'desktop',
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === desktopRef.current || target.dataset.desktopContainer === 'true') {
      setSelectedId(null);
      hideContextMenu();
    }
  };

  const handleDragStart = (id: string, type: 'shortcut' | 'folder') => {
    setDragItem({ id, type });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragItem) return;
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.floor((e.clientX - rect.left - 12) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top - 60) / GRID_SIZE);
    const pos = { x: Math.max(0, x), y: Math.max(0, y) };

    if (dragItem.type === 'shortcut') {
      useStore.getState().updateShortcutPosition(dragItem.id, pos);
    } else {
      useStore.getState().updateFolderPosition(dragItem.id, pos);
    }
    setDragItem(null);
  };

  // Keyboard shortcut for Spotlight (Cmd/Ctrl + F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        toggleSpotlight();
      }
      if (e.key === 'Escape' && spotlightOpen) {
        closeSpotlight();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={desktopRef}
      className="absolute inset-0 bottom-24 z-[1] overflow-hidden"
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div 
        className="relative w-full h-full pt-14 px-4"
        data-desktop-container="true"
      >
        {/* Folders */}
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
        {/* Shortcuts */}
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

      {/* Spotlight Search */}
      {spotlightOpen && (
        <SpotlightSearch onClose={closeSpotlight} />
      )}
    </div>
  );
}

// ========== SPOTLIGHT SEARCH (iOS) ==========
function SpotlightSearch({ onClose }: { onClose: () => void }) {
  const { shortcuts, folders, openWindow } = useStore();
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const desktopShortcuts = shortcuts.filter((s) => s.folderId === null || s.folderId === undefined);
  const filteredShortcuts = search
    ? desktopShortcuts.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : desktopShortcuts.slice(0, 5);
  const filteredFolders = search
    ? folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const openShortcut = (shortcut: Shortcut) => {
    openWindow({
      title: shortcut.name,
      icon: shortcut.icon,
      type: 'shortcut',
      shortcutId: shortcut.id,
      x: Math.min(100 + Math.random() * 100, window.innerWidth - 400),
      y: Math.min(100 + Math.random() * 50, window.innerHeight - 300),
      width: Math.min(900, window.innerWidth - 100),
      height: Math.min(600, window.innerHeight - 200),
    });
    onClose();
  };

  const openFolder = (folder: Folder) => {
    openWindow({
      title: folder.name,
      icon: folder.icon,
      type: 'folder',
      folderId: folder.id,
      x: Math.min(150 + Math.random() * 100, window.innerWidth - 400),
      y: Math.min(120 + Math.random() * 50, window.innerHeight - 300),
      width: Math.min(700, window.innerWidth - 100),
      height: Math.min(500, window.innerHeight - 200),
    });
    onClose();
  };

  return (
    <div 
      className="absolute inset-0 z-[10000] flex items-start justify-center pt-20 animate-ios-fade-in"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <div 
        className="ios-glass-heavy w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl animate-ios-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="p-4 border-b border-white/10">
          <div className="ios-search flex items-center gap-2 px-3 py-2">
            <Search size={18} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca no WebDesk"
              className="flex-1 bg-transparent text-white placeholder-gray-400 text-base outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredFolders.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Pastas</div>
              {filteredFolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => openFolder(f)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all text-left"
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-sm text-white font-medium">{f.name}</span>
                </button>
              ))}
            </div>
          )}

          {filteredShortcuts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Atalhos</div>
              {filteredShortcuts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openShortcut(s)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all text-left"
                >
                  <span className="text-2xl">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{s.name}</div>
                    <div className="text-xs text-gray-400 truncate">{s.category}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredShortcuts.length === 0 && filteredFolders.length === 0 && search && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Nenhum resultado para "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== DESKTOP ICON (iOS style) ==========
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
  const { setContextMenu, openWindow, updateShortcut, updateFolder } = useStore();
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  const position = item.position || { x: 0, y: 0 };
  const left = 12 + position.x * gridSize;
  const top = 12 + position.y * gridSize;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'shortcut') {
      const shortcut = item as Shortcut;
      openWindow({
        title: shortcut.name,
        icon: shortcut.icon,
        type: 'shortcut',
        shortcutId: shortcut.id,
        x: Math.min(100 + Math.random() * 100, window.innerWidth - 400),
        y: Math.min(100 + Math.random() * 50, window.innerHeight - 300),
        width: Math.min(900, window.innerWidth - 100),
        height: Math.min(600, window.innerHeight - 200),
      });
    } else {
      const folder = item as Folder;
      openWindow({
        title: folder.name,
        icon: folder.icon,
        type: 'folder',
        folderId: folder.id,
        x: Math.min(150 + Math.random() * 100, window.innerWidth - 400),
        y: Math.min(120 + Math.random() * 50, window.innerHeight - 300),
        width: Math.min(700, window.innerWidth - 100),
        height: Math.min(500, window.innerHeight - 200),
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

  const renderIcon = () => {
    if (type === 'folder') {
      return (
        <div className="ios-icon w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
          <span className="text-3xl">{(item as Folder).icon}</span>
        </div>
      );
    }
    const shortcut = item as Shortcut;
    if (shortcut.iconType === 'image') {
      return (
        <div className="ios-icon w-14 h-14 overflow-hidden">
          <img
            src={shortcut.icon}
            alt={shortcut.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      );
    }
    if (shortcut.iconType === 'color') {
      return (
        <div
          className="ios-icon w-14 h-14 flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: shortcut.color || '#007AFF' }}
        >
          {shortcut.name.charAt(0).toUpperCase()}
        </div>
      );
    }
    return (
      <div className="ios-icon w-14 h-14 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900">
        <span className="text-3xl">{shortcut.icon}</span>
      </div>
    );
  };

  return (
    <div
      className={`desktop-icon absolute flex flex-col items-center gap-1.5 cursor-pointer select-none group`}
      style={{ 
        left,
        top,
        width: gridSize - 8,
      }}
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
      <div className={`transition-transform ${selected ? 'scale-90 opacity-80' : ''}`}>
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
          className="ios-label bg-black/50 text-white rounded px-1 py-0.5 outline-none text-center"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="ios-label">
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
    <div className="absolute inset-0 bottom-24 z-[100] pointer-events-none">
      {windows.map((win) => (
        <Window key={win.id} window={win} />
      ))}
    </div>
  );
}

// ========== WINDOW (iOS style) ==========
function Window({ window: win }: { window: WindowState }) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow } = useStore();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, winX: 0, winY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

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
        useStore.getState().updateWindowPosition(win.id, dragStart.current.winX + dx, dragStart.current.winY + dy);
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const newW = Math.max(300, resizeStart.current.w + dx);
        const newH = Math.max(200, resizeStart.current.h + dy);
        useStore.getState().updateWindowSize(win.id, newW, newH);
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
    ? { top: 44, left: 0, width: '100%', height: 'calc(100% - 140px)', zIndex: win.zIndex, borderRadius: 0 }
    : { top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      ref={windowRef}
      className="absolute ios-window flex flex-col pointer-events-auto animate-ios-scale-in bg-white dark:bg-gray-900"
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar - iOS traffic lights style */}
      <div
        className="flex items-center h-11 px-4 ios-window-titlebar select-none cursor-move shrink-0 border-b border-gray-200/20 dark:border-gray-700/50"
        onMouseDown={handleMouseDown}
        onDoubleClick={() => maximizeWindow(win.id)}
      >
        {/* Traffic lights */}
        <div className="window-controls flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center group"
            aria-label="Fechar"
          >
            <X size={8} className="text-red-900 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center group"
            aria-label="Minimizar"
          >
            <Minus size={8} className="text-yellow-900 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center group"
            aria-label="Maximizar"
          >
            <Maximize2 size={7} className="text-green-900 opacity-0 group-hover:opacity-100" />
          </button>
        </div>

        {/* Title */}
        <span className="flex-1 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 truncate px-4">
          {win.title}
        </span>
        <div className="w-16" /> {/* Spacer para centralizar título */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        <WindowContent window={win} />
      </div>

      {/* Resize handle */}
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (!shortcut) return <div className="p-4 text-gray-500">Atalho não encontrado</div>;

  if (iframeError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-white dark:bg-gray-900">
        <AlertTriangle size={48} className="text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Site não pode ser exibido
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          "{shortcut.name}" bloqueia incorporação por segurança.
        </p>
        <a
          href={shortcut.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 ios-button"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-3 z-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Carregando...</p>
          <a
            href={shortcut.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-1 ios-button"
          >
            <ExternalLink size={12} />
            Abrir em nova aba
          </a>
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
    </div>
  );
}

// ========== FOLDER CONTENT ==========
function FolderContent({ folderId }: { folderId: string }) {
  const { shortcuts, folders, openWindow } = useStore();
  const folder = folders.find((f) => f.id === folderId);
  const folderShortcuts = shortcuts.filter((s) => s.folderId === folderId);

  if (!folder) return <div className="p-4 text-gray-500">Pasta não encontrada</div>;

  return (
    <div className="p-5 h-full overflow-auto bg-gray-50 dark:bg-gray-800/50">
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
        {folderShortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-all ios-button"
            onDoubleClick={() => {
              openWindow({
                title: shortcut.name,
                icon: shortcut.icon,
                type: 'shortcut',
                shortcutId: shortcut.id,
                x: Math.min(100 + Math.random() * 100, window.innerWidth - 400),
                y: Math.min(100 + Math.random() * 50, window.innerHeight - 300),
                width: Math.min(900, window.innerWidth - 100),
                height: Math.min(600, window.innerHeight - 200),
              });
            }}
          >
            <div className="ios-icon w-12 h-12 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900">
              <span className="text-2xl">{shortcut.icon}</span>
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 text-center truncate w-full">
              {shortcut.name}
            </span>
          </div>
        ))}
        {folderShortcuts.length === 0 && (
          <div className="col-span-full text-center text-gray-400 dark:text-gray-500 py-12">
            <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">Pasta vazia</p>
            <p className="text-xs mt-1">Arraste atalhos para cá</p>
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
    showToast('Configuração exportada!', 'success');
  };

  const handleImport = () => {
    const success = importData(importText);
    if (success) {
      showToast('Configuração importada!', 'success');
      setShowImport(false);
      setImportText('');
    } else {
      showToast('JSON inválido', 'error');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const success = importData(text);
      showToast(success ? 'Importado com sucesso!' : 'Arquivo inválido', success ? 'success' : 'error');
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
      showToast('Papel de parede aplicado!', 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-800/50">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configurações</h2>

      {/* Tema */}
      <section className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Aparência</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ios-button ${
              theme === 'light' 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Sun size={18} /> Claro
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ios-button ${
              theme === 'dark' 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Moon size={18} /> Escuro
          </button>
        </div>
      </section>

      {/* Papel de Parede */}
      <section className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Papel de Parede</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {WALLPAPERS.map((wp, i) => (
            <button
              key={i}
              onClick={() => setWallpaper(wp)}
              className={`aspect-square rounded-xl transition-all ios-button ${
                wallpaper === wp ? 'ring-3 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-95' : ''
              }`}
              style={{ background: wp }}
              aria-label={`Papel de parede ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm ios-button">
            <Image size={14} />
            <span>Upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customWallpaper || '#007AFF'}
              onChange={(e) => setCustomWallpaper(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer"
            />
            <button
              onClick={() => setWallpaper(customWallpaper)}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 ios-button"
            >
              Cor
            </button>
          </div>
        </div>
      </section>

      {/* Dados */}
      <section className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Dados</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors ios-button"
          >
            <Download size={16} /> Exportar
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors ios-button"
          >
            <Upload size={16} /> Importar
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors cursor-pointer ios-button">
            <Upload size={16} /> Arquivo
            <input type="file" accept=".json" className="hidden" onChange={handleFileImport} />
          </label>
        </div>
        {showImport && (
          <div className="mt-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole o JSON aqui..."
              className="w-full h-28 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-mono resize-none outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleImport}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 text-sm ios-button"
            >
              Importar
            </button>
          </div>
        )}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>{shortcuts.length} atalhos • {folders.length} pastas • {trash.length} na lixeira</p>
        </div>
      </section>
    </div>
  );
}

// ========== TRASH CONTENT ==========
function TrashContent() {
  const { trash, restoreShortcut, permanentlyDelete, emptyTrash } = useStore();

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lixeira</h2>
        {trash.length > 0 && (
          <button
            onClick={() => { emptyTrash(); showToast('Lixeira esvaziada', 'info'); }}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors ios-button"
          >
            Esvaziar
          </button>
        )}
      </div>

      {trash.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-16">
          <Trash2 size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Lixeira vazia</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trash.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="ios-icon w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900">
                  <span className="text-xl">{item.shortcut.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.shortcut.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.deletedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { restoreShortcut(item.id); showToast('Restaurado!', 'success'); }}
                  className="p-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors ios-button"
                  title="Restaurar"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => { permanentlyDelete(item.id); showToast('Excluído', 'info'); }}
                  className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors ios-button"
                  title="Excluir"
                >
                  <Trash2 size={16} />
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
    <div className="p-8 h-full overflow-auto flex flex-col items-center justify-center text-center bg-white dark:bg-gray-900">
      <div className="ios-icon w-20 h-20 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 mb-4">
        <span className="text-4xl">🖥️</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">WebDesk</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Sua Área de Trabalho na Web</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        Um ambiente de desktop completo no navegador. Organize atalhos, crie pastas e personalize tudo.
      </p>
      <div className="mt-6 text-xs text-gray-400 dark:text-gray-500">
        <p>Versão 1.0.0 • iOS Edition</p>
      </div>
    </div>
  );
}

// ========== DOCK (iOS style) ==========
// Estado global para Spotlight
let spotlightOpen = false;
let spotlightListeners: (() => void)[] = [];

function toggleSpotlight() {
  spotlightOpen = !spotlightOpen;
  spotlightListeners.forEach((l) => l());
}

function closeSpotlight() {
  spotlightOpen = false;
  spotlightListeners.forEach((l) => l());
}

function Dock() {
  const { shortcuts, windows, openWindow, setTheme, theme } = useStore();

  // Pinned shortcuts + system apps
  const pinned = shortcuts.filter((s) => s.pinnedTaskbar && (s.folderId === null || s.folderId === undefined));
  const systemApps = [
    { id: 'settings', name: 'Ajustes', icon: '⚙️', action: () => openWindow({ title: 'Ajustes', icon: '⚙️', type: 'settings', x: 200, y: 100, width: 600, height: 500 }) },
    { id: 'trash', name: 'Lixeira', icon: '🗑️', action: () => openWindow({ title: 'Lixeira', icon: '🗑️', type: 'trash', x: 250, y: 120, width: 500, height: 400 }) },
    { id: 'new', name: 'Novo', icon: '➕', action: () => setGlobalModal({ showNewShortcut: true }) },
  ];

  const handleOpenShortcut = (shortcut: Shortcut) => {
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
        x: Math.min(100 + Math.random() * 100, window.innerWidth - 400),
        y: Math.min(100 + Math.random() * 50, window.innerHeight - 300),
        width: Math.min(900, window.innerWidth - 100),
        height: Math.min(600, window.innerHeight - 200),
      });
    }
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[9999]">
      <div className="ios-dock flex items-center gap-2 px-3 py-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="ios-icon w-12 h-12 flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-400 dark:from-indigo-500 dark:to-purple-700 ios-button"
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          <span className="text-2xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-white/20 mx-1" />

        {/* Pinned shortcuts */}
        {pinned.map((shortcut) => {
          const isOpen = windows.some((w) => w.shortcutId === shortcut.id);
          return (
            <button
              key={shortcut.id}
              onClick={() => handleOpenShortcut(shortcut)}
              className="relative ios-icon w-12 h-12 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900 ios-button"
              title={shortcut.name}
            >
              <span className="text-2xl">{shortcut.icon}</span>
              {isOpen && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );
        })}

        {/* System apps */}
        {systemApps.map((app) => (
          <button
            key={app.id}
            onClick={app.action}
            className={`ios-icon w-12 h-12 flex items-center justify-center ios-button ${
              app.id === 'settings' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
              app.id === 'trash' ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
              'bg-gradient-to-br from-green-400 to-green-600'
            }`}
            title={app.name}
          >
            <span className="text-2xl">{app.icon}</span>
          </button>
        ))}

        {/* Spotlight */}
        <button
          onClick={toggleSpotlight}
          className="ios-icon w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 ios-button"
          title="Spotlight"
        >
          <Search size={22} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ========== CONTEXT MENU (iOS style) ==========
let globalModalState = {
  showNewShortcut: false,
  editingShortcut: null as Shortcut | null,
  showNewFolder: false,
};
let modalListeners: (() => void)[] = [];

function setGlobalModal(updates: Partial<typeof globalModalState>) {
  globalModalState = { ...globalModalState, ...updates };
  modalListeners.forEach((l) => l());
}

function GlobalModals() {
  const [, setTick] = useState(0);
  const { addShortcut, addFolder, updateShortcut } = useStore();

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    modalListeners.push(listener);
    return () => {
      modalListeners = modalListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <>
      {globalModalState.showNewShortcut && (
        <ShortcutFormModal
          onClose={() => setGlobalModal({ showNewShortcut: false })}
          onSave={(data) => {
            addShortcut(data);
            setGlobalModal({ showNewShortcut: false });
            showToast('Atalho criado!', 'success');
          }}
        />
      )}
      {globalModalState.editingShortcut && (
        <ShortcutFormModal
          shortcut={globalModalState.editingShortcut}
          onClose={() => setGlobalModal({ editingShortcut: null })}
          onSave={(data) => {
            updateShortcut(globalModalState.editingShortcut!.id, data);
            setGlobalModal({ editingShortcut: null });
            showToast('Atualizado!', 'success');
          }}
        />
      )}
      {globalModalState.showNewFolder && (
        <FolderFormModal
          onClose={() => setGlobalModal({ showNewFolder: false })}
          onSave={(name) => {
            addFolder(name);
            setGlobalModal({ showNewFolder: false });
            showToast('Pasta criada!', 'success');
          }}
        />
      )}
    </>
  );
}

function ContextMenu() {
  const { contextMenu, hideContextMenu, deleteShortcut, deleteFolder, togglePinTaskbar, togglePinStart, shortcuts, folders } = useStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideContextMenu();
    };
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

  const targetShortcut = contextMenu.targetId ? shortcuts.find((s) => s.id === contextMenu.targetId) : null;
  const targetFolder = contextMenu.targetId ? folders.find((f) => f.id === contextMenu.targetId) : null;

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(contextMenu.y, window.innerHeight - 300),
    left: Math.min(contextMenu.x, window.innerWidth - 220),
    zIndex: 99999,
  };

  return (
    <div
      ref={menuRef}
      className="ios-context-menu py-1 min-w-[220px] animate-ios-pop bg-white/90 dark:bg-gray-800/90"
      style={menuStyle}
    >
      {contextMenu.type === 'desktop' && (
        <>
          <MenuItem icon={<Plus size={16} />} label="Novo Atalho" onClick={() => { hideContextMenu(); setGlobalModal({ showNewShortcut: true }); }} />
          <MenuItem icon={<FolderOpen size={16} />} label="Nova Pasta" onClick={() => { hideContextMenu(); setGlobalModal({ showNewFolder: true }); }} />
          <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-1" />
          <MenuItem icon={<Settings size={16} />} label="Ajustes" onClick={() => {
            useStore.getState().openWindow({ title: 'Ajustes', icon: '⚙️', type: 'settings', x: 200, y: 100, width: 600, height: 500 });
            hideContextMenu();
          }} />
        </>
      )}

      {contextMenu.type === 'shortcut' && targetShortcut && (
        <>
          <MenuItem icon={<Edit3 size={16} />} label="Editar" onClick={() => { hideContextMenu(); setGlobalModal({ editingShortcut: targetShortcut }); }} />
          <MenuItem icon={<Edit3 size={16} />} label="Renomear" onClick={() => {
            const newName = prompt('Novo nome:', targetShortcut.name);
            if (newName?.trim()) useStore.getState().updateShortcut(targetShortcut.id, { name: newName.trim() });
            hideContextMenu();
          }} />
          <MenuItem
            icon={targetShortcut.pinnedTaskbar ? <PinOff size={16} /> : <Pin size={16} />}
            label={targetShortcut.pinnedTaskbar ? 'Remover do Dock' : 'Adicionar ao Dock'}
            onClick={() => { togglePinTaskbar(targetShortcut.id); hideContextMenu(); }}
          />
          <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-1" />
          <MenuItem icon={<Trash2 size={16} />} label="Excluir" onClick={() => { deleteShortcut(targetShortcut.id); hideContextMenu(); showToast('Movido para lixeira', 'info'); }} danger />
        </>
      )}

      {contextMenu.type === 'folder' && targetFolder && (
        <>
          <MenuItem icon={<Edit3 size={16} />} label="Renomear" onClick={() => {
            const newName = prompt('Novo nome:', targetFolder.name);
            if (newName?.trim()) useStore.getState().updateFolder(targetFolder.id, { name: newName.trim() });
            hideContextMenu();
          }} />
          <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-1" />
          <MenuItem icon={<Trash2 size={16} />} label="Excluir" onClick={() => { deleteFolder(targetFolder.id); hideContextMenu(); showToast('Pasta excluída', 'info'); }} danger />
        </>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ios-button ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
          : 'text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ========== SHORTCUT FORM MODAL (iOS style) ==========
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
  const [color, setColor] = useState(shortcut?.color || '#007AFF');
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-ios-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {shortcut ? 'Editar Atalho' : 'Novo Atalho'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 ios-button">
            <X size={14} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Google"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ícone</label>
            <div className="flex gap-2 mb-3">
              {(['emoji', 'image', 'color'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIconType(type)}
                  className={`px-4 py-2 text-xs rounded-xl font-medium transition-all ios-button ${
                    iconType === type
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {type === 'emoji' ? 'Emoji' : type === 'image' ? 'Imagem' : 'Cor'}
                </button>
              ))}
            </div>

            {iconType === 'emoji' && (
              <div className="grid grid-cols-8 gap-1.5 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl max-h-32 overflow-y-auto">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg hover:bg-white dark:hover:bg-gray-700 transition-all ios-button ${
                      emoji === e ? 'bg-blue-500 ring-2 ring-blue-300' : ''
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
                placeholder="URL da imagem"
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {iconType === 'color' && (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer"
                />
                <span className="text-sm text-gray-500 font-mono">{color}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ios-button"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 ios-button"
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
    if (name.trim()) onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-ios-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nova Pasta</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 ios-button">
            <X size={14} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da pasta"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ios-button"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 ios-button"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
