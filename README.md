# Space Invaders Game

A modern Space Invaders game built with React, TypeScript, and Vite. Defend Earth from alien invasions in this classic arcade-style shooter!

![Space Invaders](https://via.placeholder.com/800x400/0f172a/38bdf8?text=Space+Invaders+Game)

## 🎮 Features

- **Classic Gameplay**: Move your ship, shoot aliens, and defend Earth!
- **Multiple Enemy Types**:
  - 🔴 **Basic** - Standard enemies (10 points)
  - 🟠 **Fast** - Quick-moving enemies (20 points)
  - 🟣 **Tank** - Tough enemies requiring 3 hits (50 points)
- **Level System**: Progress through increasingly challenging levels
- **High Score**: Saves your best score to localStorage
- **Particle Effects**: Satisfying explosion effects
- **Smooth Animations**: 60 FPS gameplay with canvas rendering

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Controls

| Key | Action |
|-----|--------|
| ← / A | Move left |
| → / D | Move right |
| SPACE | Shoot |
| ESC | Pause/Resume |
| ENTER | Start game / Play again |

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Canvas API** - Game rendering

## 📁 Project Structure

```
src/
├── App.tsx          # Main game component
├── main.tsx         # Entry point
├── index.css        # Global styles
└── vite-env.d.ts    # Vite type definitions
```

## 🎨 Game Mechanics

- Player starts with 3 lives
- Enemies spawn continuously during gameplay
- Clear all enemies to advance to the next level
- Enemy spawn rate increases with each level
- High score is persisted in localStorage

## 🤝 Contributing

Feel free to fork this repository and make your own improvements!

## 📝 License

MIT License - feel free to use this for learning or your own projects.
