import '@fontsource-variable/inter/index.css'
import '@/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { db } from '@/db'
import { seedDatabaseIfEmpty } from '@/db/seed'

void db.open()
  .then(() => seedDatabaseIfEmpty(db))
  .catch((error: unknown) => {
    console.error('Failed to seed the local food database.', error)
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
