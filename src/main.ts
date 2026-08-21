import type { NetSession } from './game/net.ts';
import { renderAbout } from './ui/about-view.ts';
import { renderGame, type GameMode } from './ui/board-view.ts';
import { renderMenu } from './ui/menu.ts';
import { renderNet } from './ui/net-view.ts';
import { renderRules } from './ui/rules-view.ts';

type Screen = 'menu' | 'rules' | 'about' | 'game' | 'net';

const app = document.getElementById('app');
if (!app) throw new Error('#app root element not found');

function showScreen(screen: Screen, gameMode: GameMode = 'pvp', netSession?: NetSession): void {
  switch (screen) {
    case 'menu':
      renderMenu(app!, {
        onLocalGame: () => showScreen('game', 'pvp'),
        onVsComputer: () => showScreen('game', 'pvc'),
        onNetworkGame: () => showScreen('net'),
        onRules: () => showScreen('rules'),
        onAbout: () => showScreen('about'),
      });
      break;
    case 'rules':
      renderRules(app!, () => showScreen('menu'));
      break;
    case 'about':
      renderAbout(app!, () => showScreen('menu'));
      break;
    case 'net':
      renderNet(app!, {
        onBack: () => showScreen('menu'),
        onGameStart: (session) => showScreen('game', 'net', session),
      });
      break;
    case 'game':
      renderGame(
        app!,
        gameMode,
        () => {
          netSession?.leave();
          showScreen('menu');
        },
        netSession,
      );
      break;
  }
}

showScreen('menu');
