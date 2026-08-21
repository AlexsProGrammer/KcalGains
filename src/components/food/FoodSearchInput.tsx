import { CloudDownload, ScanLine, Search, Wifi, WifiOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FoodSearchInputProps = {
  query: string
  onQueryChange: (query: string) => void
  onRemoteSearch: () => void
  onScan: () => void
  isRemoteSearching: boolean
}

export function FoodSearchInput({ query, onQueryChange, onRemoteSearch, onScan, isRemoteSearching }: FoodSearchInputProps) {
  const isOnline = typeof navigator === 'undefined' || navigator.onLine

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search foods or barcode"
            aria-label="Search foods or barcode"
            className="min-h-11 w-full rounded-md border border-slate-700 bg-slate-950/70 pl-10 pr-10 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
          {query ? <button type="button" onClick={() => onQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200" aria-label="Clear food search"><X className="h-4 w-4" aria-hidden="true" /></button> : null}
        </div>
        <span className="hidden items-center gap-1 text-xs text-slate-500 sm:flex" title={isOnline ? 'Online' : 'Offline'}>
          {isOnline ? <Wifi className="h-4 w-4 text-emerald-400" aria-hidden="true" /> : <WifiOff className="h-4 w-4 text-amber-400" aria-hidden="true" />}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onRemoteSearch} disabled={!query.trim() || isRemoteSearching}>
          <CloudDownload className="mr-2 h-4 w-4" aria-hidden="true" />
          {isRemoteSearching ? 'Searching...' : 'Search Open Food Facts'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onScan}>
          <ScanLine className="mr-2 h-4 w-4" aria-hidden="true" />
          Scan barcode
        </Button>
      </div>
    </div>
  )
}
