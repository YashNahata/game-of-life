# Conway's Game of Life

An interactive implementation of **Conway's Game of Life** built with React, TypeScript, Vite, and Tailwind CSS.

<img width="1588" height="1104" alt="Sample Image" src="https://github.com/user-attachments/assets/c0a96c55-38c1-43a4-b112-925af41d37e8" />

## About the Game

Game of Life is a cellular automaton where each cell is either alive or dead.
At every generation, all cells update simultaneously using four rules:

1. A live cell with fewer than 2 live neighbors dies.
2. A live cell with 2 or 3 live neighbors lives.
3. A live cell with more than 3 live neighbors dies.
4. A dead cell with exactly 3 live neighbors becomes alive.

## Project Highlights

- Infinite interactive grid with pan + zoom behavior.
- Play controls: Start / Pause / Resume and Next generation.
- Speed multipliers: 1x, 2x, 4x, 8x.
- Preset patterns: Block, Blinker, Toad, Beacon, Glider, LWSS, Pulsar.
- Random mode with adjustable initial live-cell density.

## Run (Yarn)

```bash
yarn install
yarn dev
```

For production build:

```bash
yarn build
```
