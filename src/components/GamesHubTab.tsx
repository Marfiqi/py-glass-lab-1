import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowClockwise, Code, GameController, X } from "@phosphor-icons/react";
import AcrylicIcon from "./AcrylicIcon";
import CodeBlock from "./CodeBlock";
import { GAMES } from "../data/pythonData";
import { useHub } from "../hooks/useHub.tsx";
import type { GameDef } from "../types";

type TabId = "list" | "play";

interface GameScreenProps {
  game: GameDef;
  onExit: () => void;
  onScore: (score: number) => void;
  onViewCode: () => void;
}

interface GameCanvasProps {
  game: GameDef;
  onScore: (score: number) => void;
}

const CELL = 20;
const TETRIS_COLORS = ["#22d3ee", "#3b82f6", "#a78bfa", "#fbbf24", "#4ade80", "#f472b6", "#fb7185"];
const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
];

function drawAcrylic(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, hue: string) {
  ctx.shadowColor = hue + "55";
  ctx.shadowBlur = 8;
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "rgba(255,255,255,0.32)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.10)");
  grad.addColorStop(1, "rgba(15,23,42,0.72)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, w - 4, h * 0.4, Math.max(0, r - 3));
  ctx.fill();
}

/* ── Tetris ─────────────────────────────────────────── */
function useTetris(onScore: (s: number) => void) {
  const W = 10;
  const H = 20;
  const [board, setBoard] = useState<(number | null)[][]>(() => Array.from({ length: H }, () => Array(W).fill(null)));
  const [piece, setPiece] = useState<{ shape: number[][]; x: number; y: number; color: number } | null>(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (!running || over) return;
    const speed = Math.max(70, 450 - score * 2);
    const iv = setInterval(() => movePiece(0, 1), speed);
    return () => clearInterval(iv);
  }, [running, over, score]);

  const collide = (b: (number | null)[][], shape: number[][], px: number, py: number): boolean => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = px + c;
        const ny = py + r;
        if (nx < 0 || nx >= W || ny >= H) return true;
        if (ny >= 0 && b[ny][nx] !== null) return true;
      }
    }
    return false;
  };

  const spawn = (b: (number | null)[][]): { shape: number[][]; x: number; y: number; color: number } | null => {
    const idx = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[idx];
    const x = Math.floor((W - shape[0].length) / 2);
    if (collide(b, shape, x, 0)) return null;
    return { shape, x, y: 0, color: idx };
  };

  const merge = (b: (number | null)[][], p: { shape: number[][]; x: number; y: number; color: number }): (number | null)[][] => {
    const nb = b.map((row) => [...row]);
    p.shape.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v && p.y + r >= 0) nb[p.y + r][p.x + c] = p.color;
      });
    });
    return nb;
  };

  const movePiece = (dx: number, dy: number) => {
    setPiece((prev) => {
      if (!prev || !running) return prev;
      const b = boardRef.current;
      if (!collide(b, prev.shape, prev.x + dx, prev.y + dy)) {
        return { ...prev, x: prev.x + dx, y: prev.y + dy };
      }
      if (dy > 0) {
        const merged = merge(b, prev);
        let cleared = 0;
        const kept = merged.filter((row) => {
          const full = row.every((c) => c !== null);
          if (full) cleared++;
          return !full;
        });
        while (kept.length < H) kept.unshift(Array(W).fill(null));
        const gain = cleared === 0 ? 0 : [0, 100, 300, 500, 800][cleared] ?? 800;
        boardRef.current = kept;
        setBoard(kept);
        setScore((s) => s + gain);
        const next = spawn(kept);
        if (!next) {
          setOver(true);
          setRunning(false);
          onScore(scoreRef.current + gain);
        } else setPiece(next);
        return prev;
      }
      return prev;
    });
  };

  const boardRef = useRef(board);
  const scoreRef = useRef(score);
  boardRef.current = board;
  scoreRef.current = score;

  const rotate = () => {
    setPiece((prev) => {
      if (!prev || !running) return prev;
      const r = prev.shape[0].length;
      const c = prev.shape.length;
      const rotated: number[][] = Array.from({ length: c }, () => Array(r).fill(0));
      for (let i = 0; i < prev.shape.length; i++) {
        for (let j = 0; j < prev.shape[i].length; j++) {
          rotated[j][c - 1 - i] = prev.shape[i][j];
        }
      }
      for (const dx of [0, -1, 1, -2, 2]) {
        if (!collide(boardRef.current, rotated, prev.x + dx, prev.y)) {
          return { ...prev, shape: rotated, x: prev.x + dx };
        }
      }
      return prev;
    });
  };

  const hardDrop = () => setPiece((prev) => {
    if (!prev || !running) return prev;
    let y = prev.y;
    while (!collide(boardRef.current, prev.shape, prev.x, y + 1)) y++;
    return { ...prev, y };
  });

  const start = () => {
    setBoard(Array.from({ length: H }, () => Array(W).fill(null)));
    setScore(0);
    setOver(false);
    setRunning(true);
    const p = spawn(Array.from({ length: H }, () => Array(W).fill(null)));
    setPiece(p);
  };

  return { board, piece, score, over, running, start, movePiece, rotate, hardDrop };
}

function TetrisGame({ onScore }: GameCanvasProps) {
  const g = useTetris(onScore);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 400);
    ctx.fillStyle = "rgba(6,10,20,0.9)";
    ctx.fillRect(0, 0, 200, 400);
    g.board.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v !== null) {
          ctx.fillStyle = TETRIS_COLORS[v];
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, 4);
        }
      });
    });
    if (g.piece) {
      g.piece.shape.forEach((row, r) => {
        row.forEach((v, c) => {
          if (v && g.piece) {
            ctx.fillStyle = TETRIS_COLORS[g.piece.color];
            ctx.fillRect((g.piece.x + c) * CELL + 1, (g.piece.y + r) * CELL + 1, CELL - 2, CELL - 2);
            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.fillRect((g.piece.x + c) * CELL + 2, (g.piece.y + r) * CELL + 2, CELL - 4, 4);
          }
        });
      });
    }
  }, [g.board, g.piece]);

  const keys = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") g.movePiece(-1, 0);
    if (e.key === "ArrowRight") g.movePiece(1, 0);
    if (e.key === "ArrowDown") g.movePiece(0, 1);
    if (e.key === "ArrowUp") g.rotate();
    if (e.key === " ") {
      e.preventDefault();
      g.hardDrop();
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [g]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-2">
        <span className="text-xs font-bold text-[#22d3ee]">Score {g.score}</span>
        {g.over ? <span className="rounded-full bg-[#f472b6]/15 px-3 py-1 text-xs font-bold text-[#f472b6]">Game over</span> : null}
        <span className="text-xs text-[#6b7280]">{g.running ? "Playing" : "Paused"}</span>
      </div>
      <canvas ref={canvasRef} width={200} height={400} className="rounded-2xl border border-[#1f2937]" />
      {!g.running ? (
        <button onClick={g.start} className="rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] px-6 py-2.5 text-sm font-bold text-[#04101a] shadow-[0_8px_22px_-8px_#22d3eebb] transition active:scale-95">
          {g.over ? "Play again" : "Start"}
        </button>
      ) : null}
      <div className="flex items-center gap-2">
        <DpadButton label="◀" onPress={() => g.movePiece(-1, 0)} />
        <DpadButton label="▼" onPress={() => g.movePiece(0, 1)} />
        <DpadButton label="▶" onPress={() => g.movePiece(1, 0)} />
        <DpadButton label="↵" onPress={g.rotate} />
        <DpadButton label="⤓" onPress={g.hardDrop} />
      </div>
    </div>
  );
}

function DpadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1f2937] bg-[#111827] text-lg text-[#67e8f9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_14px_-6px_rgba(0,0,0,0.8)] backdrop-blur transition active:scale-90 active:bg-[#1f2937]"
    >
      {label}
    </button>
  );
}

/* ── Snake ──────────────────────────────────────────── */
function SnakeGame({ onScore }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<[number, number][]>([[5, 5]]);
  const [dir, setDir] = useState<[number, number]>([1, 0]);
  const [food, setFood] = useState<[number, number]>([10, 10]);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const dirRef = useRef(dir);
  dirRef.current = dir;

  const placeFood = (s: [number, number][]): [number, number] => {
    let f: [number, number] = [0, 0];
    do {
      f = [Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)];
    } while (s.some((seg) => seg[0] === f[0] && seg[1] === f[1]));
    return f;
  };

  useEffect(() => {
    if (!running || over) return;
    const iv = setInterval(() => {
      setSnake((prev) => {
        const head: [number, number] = [prev[0][0] + dirRef.current[0], prev[0][1] + dirRef.current[1]];
        if (head[0] < 0 || head[0] >= 20 || head[1] < 0 || head[1] >= 20 || prev.some((seg) => seg[0] === head[0] && seg[1] === head[1])) {
          setOver(true);
          setRunning(false);
          return prev;
        }
        const ns: [number, number][] = [head, ...prev];
        if (head[0] === food[0] && head[1] === food[1]) {
          setScore((s) => {
            const n = s + 10;
            onScore(n);
            return n;
          });
          setFood(placeFood(ns));
          return ns;
        }
        ns.pop();
        return ns;
      });
    }, 140);
    return () => clearInterval(iv);
  }, [running, over, food, onScore]);

  const setD = (d: [number, number]) => {
    if (dirRef.current[0] === -d[0] && dirRef.current[1] === -d[1]) return;
    setDir(d);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setD([0, -1]);
      if (e.key === "ArrowDown") setD([0, 1]);
      if (e.key === "ArrowLeft") setD([-1, 0]);
      if (e.key === "ArrowRight") setD([1, 0]);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 200);
    ctx.strokeStyle = "rgba(31,41,55,0.4)";
    for (let i = 0; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 10, 0);
      ctx.lineTo(i * 10, 200);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * 10);
      ctx.lineTo(200, i * 10);
      ctx.stroke();
    }
    drawAcrylic(ctx, food[0] * 10, food[1] * 10, 10, 10, 3, "#f472b6");
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#4ade80" : "#22d3ee";
      ctx.fillRect(seg[0] * 10 + 1, seg[1] * 10 + 1, 8, 8);
      if (i === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(seg[0] * 10 + 2, seg[1] * 10 + 2, 3, 3);
      }
    });
  }, [snake, food]);

  const start = () => {
    setSnake([[5, 5]]);
    setDir([1, 0]);
    setScore(0);
    setOver(false);
    setRunning(true);
    setFood([10, 10]);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-2">
        <span className="text-xs font-bold text-[#4ade80]">Score {score}</span>
        {over ? <span className="rounded-full bg-[#f472b6]/15 px-3 py-1 text-xs font-bold text-[#f472b6]">Game over</span> : null}
        <span className="text-xs text-[#6b7280]">{running ? "Playing" : "Paused"}</span>
      </div>
      <canvas ref={canvasRef} width={200} height={200} className="rounded-2xl border border-[#1f2937]" />
      {!running ? (
        <button onClick={start} className="rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22d3ee] px-6 py-2.5 text-sm font-bold text-[#04101a] shadow-[0_8px_22px_-8px_#4ade80bb] transition active:scale-95">
          {over ? "Play again" : "Start"}
        </button>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        <div />
        <DpadButton label="▲" onPress={() => setD([0, -1])} />
        <div />
        <DpadButton label="◀" onPress={() => setD([-1, 0])} />
        <DpadButton label="▼" onPress={() => setD([0, 1])} />
        <DpadButton label="▶" onPress={() => setD([1, 0])} />
      </div>
    </div>
  );
}

/* ── Pacman ─────────────────────────────────────────── */
const MAZE = [
  "####################",
  "#........#.........#",
  "#.##.###.#.###.##..#",
  "#...................#",
  "#.##.#.#####.#.##..#",
  "#....#...#...#.....#",
  "####.###.#.###.####",
  "    #.........#    ",
  "####.#.##.##.#.####",
  "#......#   #......#",
  "#.##.########.##.#",
  "#....#........#...#",
  "####.#.######.#.###",
  "#....#........#...#",
  "####################",
];

function PacmanGame({ onScore }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState<[number, number]>([1, 1]);
  const [dir, setDir] = useState<[number, number]>([1, 0]);
  const [ghosts, setGhosts] = useState<[number, number][]>([[9, 8], [10, 8]]);
  const [dots, setDots] = useState<[number, number][]>(() => {
    const d: [number, number][] = [];
    MAZE.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (row[c] === ".") d.push([c, r]);
    });
    return d;
  });
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const dirRef = useRef(dir);
  dirRef.current = dir;
  const posRef = useRef(pos);
  posRef.current = pos;
  const nextDirRef = useRef<[number, number] | null>(null);

  const isWall = (p: [number, number]): boolean => {
    const row = MAZE[p[1]];
    if (!row) return true;
    return row[p[0]] === "#";
  };

  useEffect(() => {
    if (!running || over || won) return;
    const iv = setInterval(() => {
      // Apply buffered direction if valid
      const nd = nextDirRef.current;
      if (nd) {
        const altNext: [number, number] = [posRef.current[0] + nd[0], posRef.current[1] + nd[1]];
        if (!isWall(altNext)) {
          dirRef.current = nd;
          nextDirRef.current = null;
        }
      }

      let next: [number, number] = [posRef.current[0] + dirRef.current[0], posRef.current[1] + dirRef.current[1]];
      // If wall ahead, stop (don't randomly turn)
      if (isWall(next)) {
        next = [...posRef.current] as [number, number];
      }

      const ns: [number, number] = next;
      setPos(ns);
      setDots((prev) => {
        const idx = prev.findIndex((d) => d[0] === ns[0] && d[1] === ns[1]);
        if (idx >= 0) {
          setScore((s) => {
            const n = s + 10;
            onScore(n);
            return n;
          });
          const nextDots = prev.filter((_, i) => i !== idx);
          if (nextDots.length === 0) {
            setWon(true);
            setRunning(false);
          }
          return nextDots;
        }
        return prev;
      });
      // Ghost AI: move each ghost one step toward Pacman using BFS-like greedy pathfinding
      setGhosts((prev) => {
        return prev.map((g) => {
          const options: [number, number][] = [];
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as [number, number][]) {
            const cand: [number, number] = [g[0] + dx, g[1] + dy];
            if (!isWall(cand)) options.push(cand);
          }
          if (options.length === 0) return g;
          // Don't reverse direction unless forced
          const reverse: [number, number] = [-dirRef.current[0], -dirRef.current[1]];
          const nonReverse = options.filter((o) => !(o[0] === g[0] - reverse[0] && o[1] === g[1] - reverse[1]));
          const candidates = nonReverse.length > 0 ? nonReverse : options;
          let best = candidates[0];
          let bd = Infinity;
          for (const o of candidates) {
            const d = Math.abs(o[0] - ns[0]) + Math.abs(o[1] - ns[1]);
            if (d < bd) {
              bd = d;
              best = o;
            }
          }
          return best;
        });
      });
    }, 260);
    return () => clearInterval(iv);
  }, [running, over, won, onScore]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") nextDirRef.current = [0, -1];
      if (e.key === "ArrowDown") nextDirRef.current = [0, 1];
      if (e.key === "ArrowLeft") nextDirRef.current = [-1, 0];
      if (e.key === "ArrowRight") nextDirRef.current = [1, 0];
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (!running) return;
    if (ghosts.some((g) => g[0] === pos[0] && g[1] === pos[1])) {
      setOver(true);
      setRunning(false);
    }
  }, [ghosts, pos, running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 210);
    ctx.fillStyle = "#060a14";
    ctx.fillRect(0, 0, 200, 210);
    MAZE.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "#") {
          drawAcrylic(ctx, c * 10, r * 10, 10, 10, 2, "#3b82f6");
        }
      }
    });
    dots.forEach((d) => {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(d[0] * 10 + 5, d[1] * 10 + 5, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(pos[0] * 10 + 5, pos[1] * 10 + 5, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ghosts.forEach((g, i) => {
      ctx.fillStyle = i === 0 ? "#f472b6" : "#fb7185";
      ctx.beginPath();
      ctx.arc(g[0] * 10 + 5, g[1] * 10 + 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(g[0] * 10 + 3, g[1] * 10 + 3, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [pos, ghosts, dots]);

  const start = () => {
    setPos([1, 1]);
    setDir([1, 0]);
    setScore(0);
    setOver(false);
    setWon(false);
    const d: [number, number][] = [];
    MAZE.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (row[c] === ".") d.push([c, r]);
    });
    setDots(d);
    setGhosts([[9, 8], [10, 8]]);
    setRunning(true);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-2">
        <span className="text-xs font-bold text-[#fbbf24]">Score {score}</span>
        {won ? <span className="rounded-full bg-[#4ade80]/15 px-3 py-1 text-xs font-bold text-[#4ade80]">Cleared!</span> : over ? <span className="rounded-full bg-[#f472b6]/15 px-3 py-1 text-xs font-bold text-[#f472b6]">Caught!</span> : null}
        <span className="text-xs text-[#6b7280]">{running ? "Playing" : "Paused"}</span>
      </div>
      <canvas ref={canvasRef} width={200} height={210} className="rounded-2xl border border-[#1f2937]" />
      {!running ? (
        <button onClick={start} className="rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#fb7185] px-6 py-2.5 text-sm font-bold text-[#1a1205] shadow-[0_8px_22px_-8px_#fbbf24bb] transition active:scale-95">
          {over || won ? "Play again" : "Start"}
        </button>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        <div />
        <DpadButton label="▲" onPress={() => setDir([0, -1])} />
        <div />
        <DpadButton label="◀" onPress={() => setDir([-1, 0])} />
        <DpadButton label="▼" onPress={() => setDir([0, 1])} />
        <DpadButton label="▶" onPress={() => setDir([1, 0])} />
      </div>
    </div>
  );
}

/* ── Hangman ────────────────────────────────────────── */
const HANG_WORDS = ["PYTHON", "FUNCTION", "LOOP", "DICTIONARY", "MODULE", "STRING", "VARIABLE", "TUPLE"];

function HangmanGame({ onScore }: GameCanvasProps) {
  const [word, setWord] = useState<string>(HANG_WORDS[Math.floor(Math.random() * HANG_WORDS.length)]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const MAX = 6;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const display = word.split("").map((c) => (guessed.includes(c) ? c : "_")).join("  ");
  const winCheck = word.split("").every((c) => guessed.includes(c));

  useEffect(() => {
    if (winCheck && running) {
      setWon(true);
      setRunning(false);
      setScore((s) => {
        const n = s + 50;
        onScore(n);
        return n;
      });
    }
  }, [winCheck, running, onScore]);

  useEffect(() => {
    if (wrong >= MAX && running) setRunning(false);
  }, [wrong, running]);

  const pick = (l: string) => {
    if (!running || guessed.includes(l)) return;
    setGuessed((g) => [...g, l]);
    if (!word.includes(l)) setWrong((w) => w + 1);
  };

  const start = () => {
    setWord(HANG_WORDS[Math.floor(Math.random() * HANG_WORDS.length)]);
    setGuessed([]);
    setWrong(0);
    setWon(false);
    setScore(0);
    setRunning(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 120, 120);
    ctx.strokeStyle = "rgba(148,163,184,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 112, 112);
    ctx.beginPath();
    ctx.moveTo(24, 8);
    ctx.lineTo(24, 4);
    ctx.moveTo(24, 4);
    ctx.lineTo(96, 4);
    ctx.lineTo(96, 28);
    ctx.stroke();
    const parts = [
      () => ctx.arc(96, 36, 8, 0, Math.PI * 2),
      () => { ctx.beginPath(); ctx.moveTo(96, 44); ctx.lineTo(96, 76); },
      () => { ctx.beginPath(); ctx.moveTo(96, 52); ctx.lineTo(78, 60); },
      () => { ctx.beginPath(); ctx.moveTo(96, 52); ctx.lineTo(114, 60); },
      () => { ctx.beginPath(); ctx.moveTo(96, 76); ctx.lineTo(82, 100); },
      () => { ctx.beginPath(); ctx.moveTo(96, 76); ctx.lineTo(110, 100); },
    ];
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < wrong; i++) {
      parts[i]();
      ctx.stroke();
    }
  }, [wrong]);

  const h = (e: KeyboardEvent) => {
    const k = e.key.toUpperCase();
    if (/^[A-Z]$/.test(k)) pick(k);
  };
  useEffect(() => {
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, guessed, word]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-2">
        <span className="text-xs font-bold text-[#f472b6]">Lives {MAX - wrong}/6</span>
        {won ? <span className="rounded-full bg-[#4ade80]/15 px-3 py-1 text-xs font-bold text-[#4ade80]">You win!</span> : !running ? <span className="rounded-full bg-[#fb7185]/15 px-3 py-1 text-xs font-bold text-[#fb7185]">Lost</span> : null}
        <span className="text-xs text-[#6b7280]">Score {score}</span>
      </div>
      <canvas ref={canvasRef} width={120} height={120} className="rounded-2xl border border-[#1f2937]" />
      <p className="font-mono text-lg font-bold tracking-widest text-white">{display}</p>
      {!running ? (
        <button onClick={start} className="rounded-xl bg-gradient-to-r from-[#f472b6] to-[#a78bfa] px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_-8px_#f472b6bb] transition active:scale-95">
          {won || wrong >= MAX ? "Play again" : "Start"}
        </button>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {letters.map((l) => {
            const used = guessed.includes(l);
            const good = used && word.includes(l);
            return (
              <button
                key={l}
                onClick={() => pick(l)}
                disabled={used || !running}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition active:scale-90 ${
                  good
                    ? "border-[#4ade80]/50 bg-[#4ade80]/15 text-[#4ade80]"
                    : used
                      ? "border-[#1f2937] bg-[#111827]/60 text-[#374151]"
                      : "border-[#1f2937] bg-[#111827] text-[#cbd5e1]"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Snake Runner ───────────────────────────────────── */
const GRAVITY = 0.45;
const JUMP_IMPULSE = -10;
function RunnerGame({ onScore }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [y, setY] = useState(0);
  const [obs, setObs] = useState<{ x: number; w: number }[]>([]);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const yRef = useRef(0);
  const vyRef = useRef(0);
  yRef.current = y;

  useEffect(() => {
    if (!running || over) return;
    let last = performance.now();
    let spawnT = 0;
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      spawnT += dt;

      // Apply gravity
      vyRef.current += GRAVITY * (dt / 16);

      // Update Y position
      const newY = yRef.current + vyRef.current * dt * 0.03;
      const clampedY = newY > 0 ? 0 : newY;
      yRef.current = clampedY;
      setY(clampedY);

      // Move & spawn obstacles
      setObs((prev) => {
        const moved = prev.map((o) => ({ ...o, x: o.x - dt * 0.055 })).filter((o) => o.x > -20);
        if (spawnT > 1500) {
          spawnT = 0;
          moved.push({ x: 200, w: 12 + Math.random() * 10 });
        }
        // Collision check
        if (moved.some((o) => o.x < 44 && o.x + o.w > 20 && yRef.current > -35 && yRef.current < 5)) {
          setOver(true);
          setRunning(false);
          return moved;
        }
        return moved;
      });

      // Score increases over time
      setScore((s) => {
        const n = s + 1;
        onScore(n);
        return n;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, over, onScore]);

  const jump = () => {
    if (!running || over || yRef.current < -2) return;
    vyRef.current = JUMP_IMPULSE;
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 120);
    ctx.fillStyle = "#060a14";
    ctx.fillRect(0, 0, 200, 120);
    ctx.strokeStyle = "rgba(31,41,55,0.8)";
    ctx.beginPath();
    ctx.moveTo(0, 92);
    ctx.lineTo(200, 92);
    ctx.stroke();
    // snake body
    ctx.fillStyle = "#2dd4bf";
    ctx.fillRect(14, 92 + y, 16, 12);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(16, 92 + y + 2, 4, 3);
    obs.forEach((o) => {
      drawAcrylic(ctx, o.x, 92 - 22 - o.w * 0.6, o.w, 22 + o.w * 0.6, 6, "#f472b6");
    });
  }, [y, obs]);

  const start = () => {
    setY(0);
    vyRef.current = 0;
    setObs([]);
    setScore(0);
    setOver(false);
    setRunning(true);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-2">
        <span className="text-xs font-bold text-[#2dd4bf]">Score {score}</span>
        {over ? <span className="rounded-full bg-[#f472b6]/15 px-3 py-1 text-xs font-bold text-[#f472b6]">Crashed</span> : null}
        <span className="text-xs text-[#6b7280]">{running ? "Running" : "Ready"}</span>
      </div>
      <canvas ref={canvasRef} width={200} height={120} className="rounded-2xl border border-[#1f2937]" />
      {!running ? (
        <button onClick={start} className="rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#22d3ee] px-6 py-2.5 text-sm font-bold text-[#04101a] shadow-[0_8px_22px_-8px_#2dd4bfbb] transition active:scale-95">
          {over ? "Play again" : "Start"}
        </button>
      ) : (
        <button onClick={jump} className="flex h-14 w-full items-center justify-center rounded-2xl border border-[#2dd4bf]/40 bg-[#2dd4bf]/10 text-sm font-bold text-[#2dd4bf] transition active:scale-95">
          Jump (Space)
        </button>
      )}
    </div>
  );
}

/* ── Hub shell ──────────────────────────────────────── */
export default function GamesHubTab() {
  const { registerGame } = useHub();
  const [tab, setTab] = useState<TabId>("list");
  const [current, setCurrent] = useState<GameDef | null>(null);
  const [codeGame, setCodeGame] = useState<GameDef | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useMemo(() => setTimeout(() => setToast(null), 2000), [toast]);

  const openGame = (g: GameDef) => {
    setCurrent(g);
    setTab("play");
  };

  const handleScore = (s: number) => {
    if (!current) return;
    registerGame(current.id, s);
    setToast(`+10 XP - ${current.name} best ${s}`);
  };

  useEffect(() => {
    return () => clearTimeout(toastT);
  }, [toastT]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#1f2937] bg-[#111827]">
          <GameController size={20} weight="duotone" className="text-[#f472b6]" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-white">Games Hub</h2>
          <p className="text-[11px] text-[#8b949e]">5 playable classics - view the Python behind each</p>
        </div>
      </div>

      {tab === "list" ? (
        <div className="space-y-3">
          {GAMES.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-[#1f2937] bg-[#111827] p-3">
              <AcrylicIcon name={g.name} glow={g.icon} size={52}>
                <GameController size={24} weight="duotone" />
              </AcrylicIcon>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{g.name}</p>
                <p className="text-[11px] text-[#8b949e]">{g.tagline}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => openGame(g)} className="rounded-lg bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-[#04101a]" style={{ background: `linear-gradient(90deg, ${g.color}, ${g.color}88)`, color: "#04101a" }}>
                  Play
                </button>
                <button onClick={() => setCodeGame(g)} className="flex items-center justify-center gap-1 rounded-lg border border-[#1f2937] px-3 py-1.5 text-[11px] font-semibold text-[#cbd5e1] transition active:scale-95">
                  <Code size={12} /> Code
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {current ? (
            <>
              <div className="flex items-center justify-between">
                <button onClick={() => setTab("list")} className="flex items-center gap-1 rounded-lg border border-[#1f2937] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] transition active:scale-95">
                  <ArrowClockwise size={13} /> Back
                </button>
                <button onClick={() => setCodeGame(current)} className="flex items-center gap-1 rounded-lg border border-[#1f2937] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] transition active:scale-95">
                  <Code size={13} /> View Python code
                </button>
              </div>
              {current.id === "tetris" ? <TetrisGame game={current} onScore={handleScore} /> : null}
              {current.id === "snake" ? <SnakeGame game={current} onScore={handleScore} /> : null}
              {current.id === "pacman" ? <PacmanGame game={current} onScore={handleScore} /> : null}
              {current.id === "hangman" ? <HangmanGame game={current} onScore={handleScore} /> : null}
              {current.id === "runner" ? <RunnerGame game={current} onScore={handleScore} /> : null}
            </>
          ) : null}
        </div>
      )}

      {/* toast */}
      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#22d3ee]/40 bg-[#111827] px-4 py-2 text-xs font-semibold text-[#67e8f9] shadow-[0_8px_24px_-8px_rgba(34,211,238,0.5)]">
          {toast}
        </div>
      ) : null}

      {/* code sheet */}
      {codeGame ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCodeGame(null)} />
          <div className="relative max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-[24px] border border-[#1f2937] bg-[#0d1424] p-5 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{codeGame.name} - Python source</h3>
              <button onClick={() => setCodeGame(null)} className="rounded-full border border-[#1f2937] bg-[#111827] p-1.5 text-[#9ca3af] transition active:scale-90">
                <X size={15} />
              </button>
            </div>
            <CodeBlock code={codeGame.code} title={codeGame.id} maxHeight={520} />
            <p className="mt-3 text-center text-[10px] text-[#4b5563]">Study the logic, then try it in the Playground</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}