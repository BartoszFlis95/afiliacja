/**
 * Ustawia motyw ZANIM przeglądarka cokolwiek namaluje.
 *
 * Musi to być zwykły, blokujący `<script>` w `<head>`, a nie efekt w Reakcie —
 * gdyby klasa `.dark` dokładała się dopiero po hydratacji, każde wejście na
 * stronę zaczynałoby się od błysku jasnego motywu.
 *
 * Skrypt jest celowo zapisany jako jeden string: nie ma zależności, nie da się
 * go rozbić o kolejność bundlowania i wykonuje się synchronicznie.
 */
export const THEME_STORAGE_KEY = "deneeu-theme"

const script = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    /* prywatne okno albo zablokowane dane witryny — zostaje jasny motyw */
  }
})();
`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
