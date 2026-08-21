import { chooseMove } from '../game/ai.ts';
import {
  applyMove,
  checkWin,
  createInitialBoard,
  getCell,
  legalMovesFrom,
  otherPlayer,
  type Board,
  type Move,
  type Player,
  type Position,
} from '../game/board.ts';
import type { NetSession } from '../game/net.ts';

export type GameMode = 'pvp' | 'pvc' | 'net';

const HUMAN_PLAYER: Player = 1;
const AI_PLAYER: Player = 2;
const AI_MOVE_DELAY_MS = 400;

interface GameState {
  board: Board;
  currentPlayer: Player;
  selected: Position | null;
  legalDestinations: Position[];
  winner: Player | null;
  aiThinking: boolean;
  peerLeft: boolean;
}

function samePos(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function playerLabel(player: Player, mode: GameMode): string {
  if (player === 1) return 'gracza 1 (jasny)';
  return mode === 'pvc' ? 'komputera (ciemny)' : 'gracza 2 (ciemny)';
}

export function renderGame(
  container: HTMLElement,
  mode: GameMode,
  onBack: () => void,
  netSession?: NetSession,
): void {
  const state: GameState = {
    board: createInitialBoard(),
    currentPlayer: 1,
    selected: null,
    legalDestinations: [],
    winner: null,
    aiThinking: false,
    peerLeft: false,
  };

  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'screen screen-game';

  const status = document.createElement('p');
  status.className = 'game-status';

  const boardEl = document.createElement('div');
  boardEl.className = 'board';

  const cells: HTMLButtonElement[] = [];
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.addEventListener('click', () => handleCellClick({ row: Math.floor(i / 4), col: i % 4 }));
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  const controls = document.createElement('div');
  controls.className = 'game-controls';

  const restartButton = document.createElement('button');
  restartButton.type = 'button';
  restartButton.className = 'btn';
  restartButton.textContent = 'Nowa gra';
  restartButton.addEventListener('click', restart);

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'btn btn-secondary';
  backButton.textContent = '← Menu';
  backButton.addEventListener('click', onBack);

  if (mode === 'net') restartButton.classList.add('hidden');

  controls.append(restartButton, backButton);
  wrapper.append(status, boardEl, controls);
  container.appendChild(wrapper);

  if (mode === 'net' && netSession) {
    if (netSession.role === 'host') {
      netSession.on('move-request', handleHostMoveRequest);
    } else {
      netSession.on('move-confirmed', (move) => applyPlayerMove(move));
    }
    netSession.on('peer-left', () => {
      state.peerLeft = true;
      render();
    });
  }

  render();

  function isInteractive(): boolean {
    if (state.winner || state.aiThinking || state.peerLeft) return false;
    if (mode === 'pvc' && state.currentPlayer !== HUMAN_PLAYER) return false;
    if (mode === 'net' && netSession && state.currentPlayer !== netSession.localPlayer) return false;
    return true;
  }

  function handleCellClick(pos: Position): void {
    if (!isInteractive()) return;

    const clickedPiece = getCell(state.board, pos);

    if (state.selected && samePos(state.selected, pos)) {
      state.selected = null;
      state.legalDestinations = [];
      render();
      return;
    }

    if (state.selected && state.legalDestinations.some((d) => samePos(d, pos))) {
      const move: Move = { from: state.selected, to: pos };

      if (mode === 'net' && netSession) {
        if (netSession.role === 'guest') {
          netSession.requestMove(move);
          state.selected = null;
          state.legalDestinations = [];
          render();
          return;
        }
        applyPlayerMove(move);
        netSession.broadcastMove(move);
        return;
      }

      applyPlayerMove(move);
      return;
    }

    if (clickedPiece === state.currentPlayer) {
      state.selected = pos;
      state.legalDestinations = legalMovesFrom(state.board, pos);
      render();
      return;
    }

    state.selected = null;
    state.legalDestinations = [];
    render();
  }

  function applyPlayerMove(move: Move): void {
    state.board = applyMove(state.board, move);
    const mover = state.currentPlayer;
    state.selected = null;
    state.legalDestinations = [];

    if (checkWin(state.board, mover)) {
      state.winner = mover;
      render();
      return;
    }

    state.currentPlayer = otherPlayer(mover);
    render();

    if (mode === 'pvc' && state.currentPlayer === AI_PLAYER) {
      state.aiThinking = true;
      render();
      window.setTimeout(runAiMove, AI_MOVE_DELAY_MS);
    }
  }

  function handleHostMoveRequest(move: Move): void {
    if (state.winner || state.currentPlayer === netSession?.localPlayer) return;
    if (getCell(state.board, move.from) !== state.currentPlayer) return;
    if (!legalMovesFrom(state.board, move.from).some((d) => samePos(d, move.to))) return;

    applyPlayerMove(move);
    netSession?.broadcastMove(move);
  }

  function runAiMove(): void {
    const move = chooseMove(state.board, AI_PLAYER);
    state.aiThinking = false;

    if (!move) {
      render();
      return;
    }

    state.board = applyMove(state.board, move);
    if (checkWin(state.board, AI_PLAYER)) {
      state.winner = AI_PLAYER;
    } else {
      state.currentPlayer = HUMAN_PLAYER;
    }
    render();
  }

  function restart(): void {
    state.board = createInitialBoard();
    state.currentPlayer = 1;
    state.selected = null;
    state.legalDestinations = [];
    state.winner = null;
    state.aiThinking = false;
    render();
  }

  function render(): void {
    for (let i = 0; i < 16; i++) {
      const pos: Position = { row: Math.floor(i / 4), col: i % 4 };
      const value = getCell(state.board, pos);
      const cell = cells[i]!;
      cell.className = 'cell';
      cell.disabled = !isInteractive();

      if (value === 1) cell.classList.add('piece-light');
      else if (value === 2) cell.classList.add('piece-dark');

      if (state.selected && samePos(state.selected, pos)) {
        cell.classList.add('cell-selected');
      }
      if (state.legalDestinations.some((d) => samePos(d, pos))) {
        cell.classList.add('cell-legal');
      }
    }

    if (state.winner) {
      if (mode === 'net' && netSession) {
        status.textContent = state.winner === netSession.localPlayer ? 'Wygrałeś!' : 'Przeciwnik wygrywa!';
      } else {
        status.textContent = `Wygrywa ${playerLabel(state.winner, mode)}!`;
      }
      status.classList.add('game-status-win');
    } else if (state.aiThinking) {
      status.textContent = 'Komputer myśli…';
      status.classList.remove('game-status-win');
    } else if (mode === 'net' && netSession && state.peerLeft) {
      status.textContent = 'Przeciwnik opuścił grę.';
      status.classList.remove('game-status-win');
    } else if (mode === 'net' && netSession) {
      status.textContent = state.currentPlayer === netSession.localPlayer ? 'Twoja tura' : 'Tura przeciwnika';
      status.classList.remove('game-status-win');
    } else {
      status.textContent = `Ruch ${playerLabel(state.currentPlayer, mode)}`;
      status.classList.remove('game-status-win');
    }
  }
}
