import '@fontsource-variable/inter/index.css'
import '@/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { db } from '@/db'
import { seedDatabaseIfEmpty } from '@/db/seed'
import { initializeSearchIndex } from '@/services/searchIndexService'

void db.open()
  .then(() => seedDatabaseIfEmpty(db))
  .then(() => initializeSearchIndex())
  .catch((error: unknown) => {
    console.error('Failed to seed the local food database.', error)
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
