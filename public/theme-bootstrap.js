/*
 * Applies the persisted accent before first paint. Kept as an external file so
 * it satisfies the `script-src 'self'` CSP, and render-blocking on purpose.
 */
(function () {
  var ACCENTS = ['emerald', 'lime', 'teal', 'cyan', 'violet', 'amber', 'rose', 'blue']
  var accent = 'emerald'
  try {
    var stored = window.localStorage.getItem('kcalgains.accent')
    if (stored && ACCENTS.indexOf(stored) !== -1) accent = stored
  } catch (error) {
    /* storage blocked — fall back to the default accent */
  }
  document.documentElement.dataset.accent = accent
  document.documentElement.classList.add('dark')
})()
