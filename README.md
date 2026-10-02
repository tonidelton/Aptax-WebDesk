# 🍎 WebDesk - Sua Área de Trabalho na Web (iOS Edition)

WebDesk é um aplicativo web com visual inspirado no iOS da Apple, onde o usuário pode instalar, abrir e organizar atalhos para sites e mini-apps.

![WebDesk](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-purple)

## 🎨 Visual iOS

O WebDesk foi redesenhado com a estética do iOS:

- **Dock inferior** com glassmorphism (efeito de vidro fosco)
- **Ícones squircle** (formato característico do iOS) com gradientes
- **Status bar** no topo com hora, Wi-Fi e bateria
- **Spotlight Search** (Cmd/Ctrl + F) para busca rápida
- **Janelas com traffic lights** (botões vermelho/amarelo/verde)
- **Animações spring** suaves estilo iOS
- **Paleta de cores iOS** (azul #007AFF, verde #34C759, etc.)
- **Glass morphism** em menus e modais
- **Wallpapers iOS** com gradientes vibrantes

## ✨ Funcionalidades

### 🎯 Gerenciamento de Atalhos
- **Criar atalhos** com nome, URL, ícone (emoji, imagem ou cor) e categoria
- **Editar e excluir** atalhos existentes
- **Abrir sites** em janelas internas (iframe) com fallback para nova aba
- **Fixar na barra de tarefas** ou no menu iniciar

### 📁 Organização
- **Arrastar e soltar** ícones na área de trabalho (snap em grade)
- **Criar pastas** para agrupar atalhos
- **Mover atalhos** entre pastas e área de trabalho
- **Renomear** atalhos e pastas

### 🪟 Janelas
- **Mover** janelas arrastando pela barra de título
- **Redimensionar** pelas bordas
- **Minimizar, maximizar e fechar** janelas
- **Z-index dinâmico** - a janela clicada fica em destaque
- **Barra de tarefas** mostra todas as janelas abertas

### 🔍 Busca e Navegação
- **Menu Iniciar** com busca em tempo real
- **Filtrar** atalhos e pastas por nome
- **Atalhos fixados** exibidos no menu iniciar

### 🎨 Personalização
- **10 papéis de parede** pré-definidos (gradientes)
- **Upload de imagem** personalizada como wallpaper
- **Cor sólida** como papel de parede
- **Tema claro/escuro** com alternância instantânea

### 💾 Dados
- **Persistência** em localStorage (salva automaticamente)
- **Exportar** configuração em JSON
- **Importar** configuração via JSON ou arquivo
- **Lixeira** para recuperar atalhos excluídos

### 📱 Responsividade
- Layout adaptável para desktop, tablet e mobile
- Suporte a toque (toque longo = menu de contexto)
- Janelas maximizadas por padrão em telas pequenas

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd webdesk

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Estrutura do Projeto

```
webdesk/
├── index.html          # HTML principal
├── package.json        # Dependências
├── vite.config.ts      # Configuração do Vite
├── tailwind.config.*   # Configuração do Tailwind
├── tsconfig.json       # Configuração TypeScript
├── src/
│   ├── main.tsx        # Entry point
│   ├── App.tsx         # Componente principal (todos os componentes)
│   ├── store.ts        # Estado global (Zustand)
│   ├── types.ts        # Tipos TypeScript
│   └── index.css       # Estilos globais e animações
└── README.md           # Este arquivo
```

## 🏗️ Arquitetura

### Estado Global (Zustand)
O estado é gerenciado pelo Zustand e persistido em localStorage com debounce de 300ms:

- **shortcuts**: Lista de atalhos
- **folders**: Lista de pastas
- **windows**: Janelas abertas (não persistido)
- **trash**: Itens na lixeira
- **theme**: Tema atual (light/dark)
- **wallpaper**: Papel de parede atual

### Componentes Principais

| Componente | Descrição |
|-----------|-----------|
| `App` | Container principal com wallpaper e layout |
| `Desktop` | Área de trabalho com grid de ícones |
| `DesktopIcon` | Ícone individual (atalho ou pasta) |
| `WindowManager` | Gerencia todas as janelas abertas |
| `Window` | Janela individual com drag/resize |
| `Taskbar` | Barra de tarefas inferior |
| `StartMenu` | Menu iniciar com busca |
| `ContextMenu` | Menu de contexto (clique direito) |
| `ShortcutFormModal` | Formulário de criar/editar atalho |
| `SettingsContent` | Configurações (tema, wallpaper, dados) |
| `TrashContent` | Lixeira com restaurar/excluir |

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Esc` | Fechar menus e modais |
| `Enter` | Confirmar renomeação |
| `Clique duplo` | Abrir atalho/pasta |
| `Clique direito` | Menu de contexto |

## 🛠️ Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS 4** - Estilização
- **Zustand** - Gerenciamento de estado
- **Lucide React** - Ícones

## 📋 Critérios de Aceitação

- [x] Criar, editar e excluir atalhos com persistência
- [x] Arrastar ícones com posição salva em grade
- [x] Clique duplo abre janela; fallback para sites que bloqueiam iframe
- [x] Janelas movíveis, redimensionáveis, minimizáveis, maximizáveis
- [x] Pastas funcionais (criar, abrir, mover atalhos)
- [x] Menu iniciar busca em tempo real
- [x] Tema e wallpaper mudam e persistem
- [x] Lixeira com restauração
- [x] Exportar/importar JSON completo
- [x] Funciona offline após primeiro carregamento

## 📄 Licença

MIT
