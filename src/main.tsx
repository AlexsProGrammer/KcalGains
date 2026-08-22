import '@fontsource-variable/inter/index.css'
import '@/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { db } from '@/db'
import { seedDatabaseIfEmpty } from '@/db/seed'
import { initializeSearchIndex } from '@/services/searchIndexService'
import { seedExerciseLibraryIfEmpty } from '@/db/exerciseSeed'

void db.open()
  .then(() => seedDatabaseIfEmpty(db))
  .then(() => seedExerciseLibraryIfEmpty(db))
  .then(() => initializeSearchIndex())
  .catch((error: unknown) => {
    console.error('Failed to seed the local food database.', error)
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
