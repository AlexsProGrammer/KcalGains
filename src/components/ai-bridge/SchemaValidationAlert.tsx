import { Alert } from '@/components/ui/alert'

export function SchemaValidationAlert({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null
  return <Alert variant="error" title="AI response needs attention">The AI returned an invalid format. Check the JSON and try again.<ul className="mt-2 list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></Alert>
}
