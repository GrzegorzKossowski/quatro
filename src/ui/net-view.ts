import { hostSession, joinSession, type NetSession } from '../game/net.ts';

export interface NetActions {
  onBack: () => void;
  onGameStart: (session: NetSession) => void;
}

const JOIN_TIMEOUT_MS = 15000;

export function renderNet(container: HTMLElement, actions: NetActions): void {
  let session: NetSession | null = null;
  let joinTimeoutId: number | undefined;

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'screen screen-text';
  container.appendChild(wrapper);

  showChoice();

  function cleanupSession(): void {
    if (joinTimeoutId !== undefined) {
      window.clearTimeout(joinTimeoutId);
      joinTimeoutId = undefined;
    }
    if (session) {
      session.leave();
      session = null;
    }
  }

  function backToMenu(): void {
    cleanupSession();
    actions.onBack();
  }

  function showChoice(): void {
    wrapper.innerHTML = '';

    const title = document.createElement('h1');
    title.textContent = 'Gra sieciowa (LAN)';

    const info = document.createElement('p');
    info.className = 'subtitle';
    info.textContent = 'Zagraj z drugą osobą przez internet, podając jej kod pokoju.';

    const hostButton = makeButton('Utwórz pokój', showHostRoom);
    const joinButton = makeButton('Dołącz do pokoju', showJoinForm);
    const backButton = makeButton('← Menu', backToMenu, 'btn-secondary');

    wrapper.append(title, info, hostButton, joinButton, backButton);
  }

  function showHostRoom(): void {
    session = hostSession();
    const s = session;

    wrapper.innerHTML = '';

    const title = document.createElement('h1');
    title.textContent = 'Kod pokoju';

    const code = document.createElement('p');
    code.className = 'net-room-code';
    code.textContent = s.roomCode;

    const status = document.createElement('p');
    status.className = 'net-status';
    status.textContent = 'Oczekiwanie na przeciwnika…';

    const cancelButton = makeButton('Anuluj', () => {
      cleanupSession();
      showChoice();
    }, 'btn-secondary');

    wrapper.append(title, code, status, cancelButton);

    s.on('peer-joined', () => {
      status.textContent = 'Przeciwnik dołączył. Rozpoczynanie gry…';
      s.start();
    });
    s.on('peer-left', () => {
      status.textContent = 'Przeciwnik opuścił pokój. Oczekiwanie na nowego…';
    });
    s.on('start', () => actions.onGameStart(s));
  }

  function showJoinForm(): void {
    wrapper.innerHTML = '';

    const title = document.createElement('h1');
    title.textContent = 'Dołącz do pokoju';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'net-code-input';
    input.maxLength = 6;
    input.placeholder = 'Kod pokoju';
    input.autocapitalize = 'characters';
    input.autocomplete = 'off';
    input.spellcheck = false;

    const connectButton = makeButton('Połącz', attemptJoin);

    const status = document.createElement('p');
    status.className = 'net-status';

    const backButton = makeButton('← Wstecz', () => {
      cleanupSession();
      showChoice();
    }, 'btn-secondary');

    wrapper.append(title, input, connectButton, status, backButton);
    input.focus();

    function attemptJoin(): void {
      const code = input.value.trim().toUpperCase();
      if (code.length === 0) return;

      cleanupSession();
      session = joinSession(code);
      const s = session;
      status.textContent = 'Łączenie…';

      let connected = false;
      joinTimeoutId = window.setTimeout(() => {
        if (connected) return;
        status.textContent = 'Nie udało się połączyć. Sprawdź kod i spróbuj ponownie.';
        cleanupSession();
      }, JOIN_TIMEOUT_MS);

      s.on('peer-joined', () => {
        connected = true;
        if (joinTimeoutId !== undefined) window.clearTimeout(joinTimeoutId);
        status.textContent = 'Połączono. Oczekiwanie na start hosta…';
      });
      s.on('peer-left', () => {
        status.textContent = 'Host opuścił pokój.';
      });
      s.on('start', () => actions.onGameStart(s));
    }
  }

  function makeButton(label: string, onClick: () => void, extraClass?: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = extraClass ? `btn ${extraClass}` : 'btn';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }
}
