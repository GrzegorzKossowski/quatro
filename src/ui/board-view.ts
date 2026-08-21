import {
  applyMove,
  checkWin,
  createInitialBoard,
  getCell,
  legalMovesFrom,
  otherPlayer,
  type Board,
  type Player,
  type Position,
} from '../game/board.ts';

interface GameState {
  board: Board;
  currentPlayer: Player;
  selected: Position | null;
  legalDestinations: Position[];
  winner: Player | null;
}

function samePos(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function renderGame(container: HTMLElement, onBack: () => void): void {
  const state: GameState = {
    board: createInitialBoard(),
    currentPlayer: 1,
    selected: null,
    legalDestinations: [],
    winner: null,
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

  controls.append(restartButton, backButton);
  wrapper.append(status, boardEl, controls);
  container.appendChild(wrapper);

  render();

  function handleCellClick(pos: Position): void {
    if (state.winner) return;

    const clickedPiece = getCell(state.board, pos);

    if (state.selected && samePos(state.selected, pos)) {
      state.selected = null;
      state.legalDestinations = [];
      render();
      return;
    }

    if (state.selected && state.legalDestinations.some((d) => samePos(d, pos))) {
      state.board = applyMove(state.board, { from: state.selected, to: pos });
      const mover = state.currentPlayer;
      state.selected = null;
      state.legalDestinations = [];
      if (checkWin(state.board, mover)) {
        state.winner = mover;
      } else {
        state.currentPlayer = otherPlayer(mover);
      }
      render();
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

  function restart(): void {
    state.board = createInitialBoard();
    state.currentPlayer = 1;
    state.selected = null;
    state.legalDestinations = [];
    state.winner = null;
    render();
  }

  function render(): void {
    for (let i = 0; i < 16; i++) {
      const pos: Position = { row: Math.floor(i / 4), col: i % 4 };
      const value = getCell(state.board, pos);
      const cell = cells[i]!;
      cell.className = 'cell';
      cell.disabled = state.winner !== null;

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
      status.textContent = `Wygrywa gracz ${state.winner === 1 ? '1 (jasny)' : '2 (ciemny)'}!`;
      status.classList.add('game-status-win');
    } else {
      status.textContent = `Ruch gracza ${state.currentPlayer === 1 ? '1 (jasny)' : '2 (ciemny)'}`;
      status.classList.remove('game-status-win');
    }
  }
}
