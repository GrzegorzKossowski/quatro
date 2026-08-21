import { joinRoom, selfId } from 'trystero';
import type { DataPayload } from 'trystero';
import type { Move, Player } from './board.ts';

const APP_ID = 'quatro-the-game';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez znaków mylących: I/O/0/1
const CODE_LENGTH = 6;

export type NetRole = 'host' | 'guest';

export const myPeerId = selfId;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

interface NetSessionEvents {
  'peer-joined': [];
  'peer-left': [];
  start: [];
  'move-request': [Move];
  'move-confirmed': [Move];
}

export interface NetSession {
  readonly role: NetRole;
  readonly roomCode: string;
  readonly localPlayer: Player;
  on<K extends keyof NetSessionEvents>(name: K, cb: (...args: NetSessionEvents[K]) => void): void;
  start(): void;
  requestMove(move: Move): void;
  broadcastMove(move: Move): void;
  leave(): void;
}

// Host jest autorytatywny: to host stosuje każdy ruch (również własny) i
// rozgłasza potwierdzony ruch do gościa, który powtarza go przez ten sam
// deterministyczny silnik gry. Dzięki temu nie ma desynchronizacji przy
// podwójnych kliknięciach ani wyścigach, bez potrzeby wysyłania całej planszy.
function createSession(role: NetRole, roomCode: string): NetSession {
  const room = joinRoom({ appId: APP_ID }, roomCode);
  const listeners: { [K in keyof NetSessionEvents]?: Array<(...args: NetSessionEvents[K]) => void> } = {};

  // Kody pokoi są krótkie i może do nich dołączyć każdy, kto je zna (lub
  // odgadnie), więc pokój może przyciągnąć więcej niż dwóch graczy. Tylko
  // pierwszy peer, który się połączy, jest traktowany jako "ten" przeciwnik —
  // każdy kolejny jest natychmiast rozłączany, a wiadomości od nierozpoznanego
  // peera są ignorowane zamiast być traktowane jako ruchy.
  let remotePeerId: string | null = null;

  function on<K extends keyof NetSessionEvents>(name: K, cb: (...args: NetSessionEvents[K]) => void): void {
    if (!listeners[name]) listeners[name] = [];
    (listeners[name] as Array<(...args: NetSessionEvents[K]) => void>).push(cb);
  }

  function emit<K extends keyof NetSessionEvents>(name: K, ...args: NetSessionEvents[K]): void {
    const cbs = listeners[name] as Array<(...args: NetSessionEvents[K]) => void> | undefined;
    if (!cbs) return;
    for (const cb of [...cbs]) cb(...args);
  }

  function rejectPeer(peerId: string): void {
    const connection = room.getPeers()[peerId];
    connection?.close();
  }

  room.onPeerJoin = (peerId) => {
    if (remotePeerId && remotePeerId !== peerId) {
      rejectPeer(peerId);
      return;
    }
    remotePeerId = peerId;
    emit('peer-joined');
  };

  room.onPeerLeave = (peerId) => {
    if (peerId !== remotePeerId) return;
    remotePeerId = null;
    emit('peer-left');
  };

  const startAction = room.makeAction('start');
  const moveAction = room.makeAction('move');

  startAction.onMessage = (_payload, context) => {
    if (context.peerId !== remotePeerId) return;
    emit('start');
  };

  moveAction.onMessage = (payload, context) => {
    if (context.peerId !== remotePeerId) return;
    const move = payload as unknown as Move;
    if (role === 'host') {
      emit('move-request', move);
    } else {
      emit('move-confirmed', move);
    }
  };

  function start(): void {
    if (!remotePeerId) return;
    void startAction.send({ go: true }, { target: remotePeerId });
    emit('start');
  }

  function requestMove(move: Move): void {
    if (!remotePeerId) return;
    void moveAction.send(move as unknown as DataPayload, { target: remotePeerId });
  }

  function broadcastMove(move: Move): void {
    if (!remotePeerId) return;
    void moveAction.send(move as unknown as DataPayload, { target: remotePeerId });
  }

  function leave(): void {
    void room.leave();
  }

  return {
    role,
    roomCode,
    localPlayer: role === 'host' ? 1 : 2,
    on,
    start,
    requestMove,
    broadcastMove,
    leave,
  };
}

export function hostSession(): NetSession {
  return createSession('host', generateRoomCode());
}

export function joinSession(roomCode: string): NetSession {
  return createSession('guest', roomCode);
}
