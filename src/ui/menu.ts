export interface MenuActions {
  onLocalGame: () => void;
  onVsComputer: () => void;
  onNetworkGame: () => void;
  onRules: () => void;
  onAbout: () => void;
}

export function renderMenu(container: HTMLElement, actions: MenuActions): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'screen screen-menu';

  const presenter = document.createElement('div');
  presenter.className = 'presenter';

  const presenterLink = document.createElement('a');
  presenterLink.className = 'presenter-link';
  presenterLink.href = 'https://kossowski.eu';
  presenterLink.target = '_blank';
  presenterLink.rel = 'noopener noreferrer';
  presenterLink.textContent = 'Grzegorz Kossowski';

  const presenterText = document.createElement('p');
  presenterText.className = 'presenter-text';
  presenterText.textContent = 'przedstawia';

  presenter.append(presenterLink, presenterText);

  const title = document.createElement('h1');
  title.textContent = 'Quatro';

  const subtitle = document.createElement('p');
  subtitle.className = 'subtitle';
  subtitle.textContent = 'Fanowski projekt znanej gry planszowej';

  const nav = document.createElement('div');
  nav.className = 'menu-nav';

  const localButton = makeButton('Gra lokalna (2 graczy)', actions.onLocalGame);

  const vsComputerButton = makeButton('Gra z komputerem', actions.onVsComputer);
  const lanButton = makeButton('Gra sieciowa (LAN)', actions.onNetworkGame);

  const rulesButton = makeButton('Zasady gry', actions.onRules, false, 'btn-secondary');
  const aboutButton = makeButton('O grze', actions.onAbout, false, 'btn-secondary');

  nav.append(localButton, vsComputerButton, lanButton, rulesButton, aboutButton);
  wrapper.append(presenter, title, subtitle, nav);
  container.appendChild(wrapper);
}

function makeButton(
  label: string,
  onClick?: () => void,
  disabled = false,
  extraClass?: string,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = extraClass ? `btn ${extraClass}` : 'btn';
  button.textContent = disabled ? `${label} (wkrótce)` : label;
  button.disabled = disabled;
  if (onClick) button.addEventListener('click', onClick);
  return button;
}
