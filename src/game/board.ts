export type Player = 1 | 2;
export type Cell = 0 | Player;

export const BOARD_SIZE = 4;

/** Flat 16-cell board, index = row * BOARD_SIZE + col. */
export type Board = Cell[];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
}

const DIRECTIONS: ReadonlyArray<Position> = [
  { row: -1, col: 0 }, // N
  { row: -1, col: 1 }, // NE
  { row: 0, col: 1 }, // E
  { row: 1, col: 1 }, // SE
  { row: 1, col: 0 }, // S
  { row: 1, col: -1 }, // SW
  { row: 0, col: -1 }, // W
  { row: -1, col: -1 }, // NW
];

export function createInitialBoard(): Board {
  const board: Board = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);
  for (let i = 0; i < BOARD_SIZE; i++) {
    setCell(board, { row: i, col: i }, 1); // light: main diagonal
    setCell(board, { row: i, col: BOARD_SIZE - 1 - i }, 2); // dark: anti-diagonal
  }
  return board;
}

export function inBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

function index(pos: Position): number {
  return pos.row * BOARD_SIZE + pos.col;
}

export function getCell(board: Board, pos: Position): Cell {
  return board[index(pos)];
}

function setCell(board: Board, pos: Position, value: Cell): void {
  board[index(pos)] = value;
}

export function otherPlayer(player: Player): Player {
  return player === 1 ? 2 : 1;
}

/**
 * The farthest unoccupied square reachable from `from` in direction `dir`,
 * sliding without jumping over pieces. Returns null if the adjacent square
 * in that direction is off-board or occupied (no move possible that way).
 */
function slideDestination(board: Board, from: Position, dir: Position): Position | null {
  let next: Position = { row: from.row + dir.row, col: from.col + dir.col };
  if (!inBounds(next) || getCell(board, next) !== 0) return null;

  let dest = next;
  next = { row: dest.row + dir.row, col: dest.col + dir.col };
  while (inBounds(next) && getCell(board, next) === 0) {
    dest = next;
    next = { row: dest.row + dir.row, col: dest.col + dir.col };
  }
  return dest;
}

/** All legal destination squares for the piece at `from`. */
export function legalMovesFrom(board: Board, from: Position): Position[] {
  const destinations: Position[] = [];
  for (const dir of DIRECTIONS) {
    const dest = slideDestination(board, from, dir);
    if (dest) destinations.push(dest);
  }
  return destinations;
}

/** All legal moves for every piece belonging to `player`. */
export function legalMovesForPlayer(board: Board, player: Player): Move[] {
  const moves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const from: Position = { row, col };
      if (getCell(board, from) !== player) continue;
      for (const to of legalMovesFrom(board, from)) {
        moves.push({ from, to });
      }
    }
  }
  return moves;
}

/** Applies a move, returning a new board (does not mutate the input). */
export function applyMove(board: Board, move: Move): Board {
  const next = board.slice();
  setCell(next, move.from, 0);
  setCell(next, move.to, getCell(board, move.from));
  return next;
}

function hasFourInRow(board: Board, player: Player): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    let all = true;
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (getCell(board, { row, col }) !== player) {
        all = false;
        break;
      }
    }
    if (all) return true;
  }
  for (let col = 0; col < BOARD_SIZE; col++) {
    let all = true;
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (getCell(board, { row, col }) !== player) {
        all = false;
        break;
      }
    }
    if (all) return true;
  }
  return false;
}

function hasAllCorners(board: Board, player: Player): boolean {
  const last = BOARD_SIZE - 1;
  const corners: Position[] = [
    { row: 0, col: 0 },
    { row: 0, col: last },
    { row: last, col: 0 },
    { row: last, col: last },
  ];
  return corners.every((pos) => getCell(board, pos) === player);
}

function hasTwoByTwoSquare(board: Board, player: Player): boolean {
  for (let row = 0; row < BOARD_SIZE - 1; row++) {
    for (let col = 0; col < BOARD_SIZE - 1; col++) {
      const square: Position[] = [
        { row, col },
        { row, col: col + 1 },
        { row: row + 1, col },
        { row: row + 1, col: col + 1 },
      ];
      if (square.every((pos) => getCell(board, pos) === player)) return true;
    }
  }
  return false;
}

/** True if `player` has met any of the game's three win conditions. */
export function checkWin(board: Board, player: Player): boolean {
  return hasFourInRow(board, player) || hasAllCorners(board, player) || hasTwoByTwoSquare(board, player);
}
