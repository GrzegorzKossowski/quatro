# Quatro (CLAUDE.md)

Ten plik jest wersjonowany w repo, żeby sesja Claude Code na dowolnym komputerze (po `git clone`/`git pull`) miała pełny kontekst projektu bez polegania na lokalnej pamięci Claude Code (ta jest przypięta do jednej maszyny i się nie synchronizuje).

## Cel projektu

**Quatro** — darmowa, niekomercyjna, fanowska gra przeglądarkowa (desktop + mobile web) inspirowana klasyczną, znaną grą planszową, hostowana pod `kossowski.eu/quatro` przez GitHub Pages. Repo: `git@github.com:GrzegorzKossowski/quatro.git`. Nazwa oryginalnej gry celowo nie pojawia się nigdzie w kodzie, treściach ani adresie URL.

Siostrzany projekt referencyjny (ten sam autor, podobny stack): [atoms](https://github.com/GrzegorzKossowski/atoms) — Vite + vanilla JS + Trystero (P2P WebRTC), hostowany pod `kossowski.eu/atoms`. Tu robimy to samo, ale w **TypeScript**.

## Zasady gry

- Plansza 4×4. Po 4 pionki na gracza. Jasne (gracz 1) startują na głównej przekątnej, ciemne (gracz 2) na przeciwprzekątnej.
- Ruch: pionek ślizga się w jednym z 8 kierunków na najdalsze wolne pole, bez przeskakiwania innych pionków (jak hetman, ale musi się ruszyć).
- Bicia nie ma — pionki nigdy nie znikają.
- Wygrana: 4 w rzędzie poziomo/pionowo (nie po skosie), LUB wszystkie 4 rogi, LUB kwadrat 2×2 własnych pionków gdziekolwiek na planszy.

## Stos technologiczny

- Vite + TypeScript, bez frameworka (vanilla DOM).
- Plansza renderowana jako CSS Grid (`div`/`button` na komórkę), nie Canvas/SVG.
- Interakcja: klik/tap na swój pionek → zaznaczenie + podświetlenie legalnych pól → klik/tap na pole docelowe → ruch. Brak drag-and-drop.
- Docelowo PvC: minimax/negamax z alfa-beta (mały branching factor, brak bić).
- Docelowo PvP sieciowe: **Trystero** (WebRTC P2P, bez własnego backendu) — jak w `atoms`. Uwaga: Trystero wymaga internetu do sygnalizacji (publiczne trackery/relaye) — to nie jest rozwiązanie działające offline w czystym LAN, tylko "P2P po kodzie pokoju bez backendu".
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages, `vite.config.ts` ma `base: '/quatro/'`.

## Struktura kodu

```
src/game/board.ts     — czysta logika: reprezentacja planszy, generowanie ruchów, detekcja wygranej (bez DOM)
src/game/ai.ts         — (Faza B) AI dla PvC
src/game/net.ts         — (Faza C) wrapper na Trystero dla LAN PvP
src/ui/menu.ts          — ekran startowy
src/ui/board-view.ts    — kontroler + render ekranu gry (hotseat PvP)
src/ui/rules-view.ts    — ekran zasad
src/ui/about-view.ts    — ekran "O grze" (disclaimer fanowskiego klonu)
src/main.ts              — router ekranów (menu/rules/about/game)
src/styles/main.css      — cały styling, mobile-first, CSS Grid
```

`board.ts` jest celowo pozbawiony zależności od DOM — łatwo go przetestować i użyć zarówno w UI, jak i w przyszłym AI (`ai.ts`) czy walidacji ruchów po sieci (`net.ts`).

## Status prac / fazy (kolejność ustalona z użytkownikiem)

- [x] **Faza A — MVP**: lokalne PvP (hotseat), menu, zasady, disclaimer, deploy na GitHub Pages.
- [x] **Faza B**: PvC (AI negamax/alpha-beta, `src/game/ai.ts`, głębokość 5, heurystyka oparta o 18 wzorców wygranej).
- [ ] **Faza C**: PvP sieciowe przez Trystero (kod pokoju, limit 2 graczy, sync ruchów).

Przycisk "Gra sieciowa (LAN)" w menu jest już widoczny, ale wyłączony ("wkrótce") do czasu ukończenia Fazy C. Człowiek zawsze gra jasnymi (gracz 1, zaczyna), komputer ciemnymi (gracz 2).

## Komendy

```
npm install
npm run dev        # serwer deweloperski
npm run build       # typecheck + build produkcyjny (dist/)
npm run typecheck   # tylko sprawdzenie typów
npm run preview     # podgląd builda produkcyjnego
```
