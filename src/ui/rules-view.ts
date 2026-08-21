export function renderRules(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'screen screen-text';

  const title = document.createElement('h1');
  title.textContent = 'Zasady gry';

  const content = document.createElement('div');
  content.className = 'text-content';
  content.innerHTML = `
    <p><strong>Plansza:</strong> 4×4 pola.</p>
    <p><strong>Pionki:</strong> każdy gracz ma 4 pionki. Jasne pionki startują na głównej przekątnej,
      ciemne na przeciwprzekątnej.</p>
    <p><strong>Ruch:</strong> gracz wybiera swój pionek i przesuwa go w jednym z 8 kierunków
      (poziomo, pionowo lub po skosie) na najdalsze wolne pole w tym kierunku — pionek nie może
      przeskoczyć przez inny pionek.</p>
    <p><strong>Bicie:</strong> nie istnieje — pionki nigdy nie znikają z planszy.</p>
    <p><strong>Wygrana</strong> — dowolny z poniższych warunków:</p>
    <ul>
      <li>cztery własne pionki w rzędzie poziomo lub pionowo (przekątne się nie liczą),</li>
      <li>własne pionki na wszystkich czterech rogach planszy,</li>
      <li>własne pionki tworzące kwadrat 2×2 w dowolnym miejscu planszy.</li>
    </ul>
    <p><strong>Sterowanie:</strong> kliknij/dotknij swój pionek, aby go zaznaczyć — podświetlą się
      pola, na które można go przesunąć. Następnie kliknij/dotknij wybrane pole docelowe.</p>
  `;

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'btn btn-secondary';
  backButton.textContent = '← Menu';
  backButton.addEventListener('click', onBack);

  wrapper.append(title, content, backButton);
  container.appendChild(wrapper);
}
