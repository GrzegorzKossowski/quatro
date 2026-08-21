import { renderAbout } from './ui/about-view.ts';
import { renderGame } from './ui/board-view.ts';
import { renderMenu } from './ui/menu.ts';
import { renderRules } from './ui/rules-view.ts';

type Screen = 'menu' | 'rules' | 'about' | 'game';

const app = document.getElementById('app');
if (!app) throw new Error('#app root element not found');

function showScreen(screen: Screen): void {
  switch (screen) {
    case 'menu':
      renderMenu(app!, {
        onLocalGame: () => showScreen('game'),
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
    case 'game':
      renderGame(app!, () => showScreen('menu'));
      break;
  }
}

showScreen('menu');
