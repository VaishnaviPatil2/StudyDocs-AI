import { cn } from '@/lib/utils'
import type { DocumentStatus } from '@/types'

const statusStyles: Record<DocumentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800 animate-pulse',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        statusStyles[status],
      )}
    >
      {status}
    </span>
  )
}
