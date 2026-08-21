export function renderAbout(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'screen screen-text';

  const title = document.createElement('h1');
  title.textContent = 'O grze';

  const content = document.createElement('div');
  content.className = 'text-content';
  content.innerHTML = `
    <p>To jest <strong>darmowy, niekomercyjny, fanowski klon</strong> klasycznej gry planszowej
      <strong>Dao</strong>, stworzony wyłącznie w celach edukacyjnych i rekreacyjnych.</p>
    <p>Projekt nie jest w żaden sposób powiązany z oryginalnymi twórcami ani wydawcą gry Dao,
      ani z serwisem GamesCrafters (UC Berkeley), skąd zaczerpnięto opis zasad gry. Nie pobiera
      opłat, nie wyświetla reklam i nie rości sobie praw do nazwy ani oryginalnego projektu gry.</p>
    <p>Kod źródłowy jest dostępny publicznie i rozwijany jako projekt hobbystyczny.</p>
  `;

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'btn btn-secondary';
  backButton.textContent = '← Menu';
  backButton.addEventListener('click', onBack);

  wrapper.append(title, content, backButton);
  container.appendChild(wrapper);
}
