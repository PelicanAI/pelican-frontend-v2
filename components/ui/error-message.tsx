import { AlertCircle } from 'lucide-react'
import { Button } from './button'

export function ErrorMessage({ 
  message, 
  retry 
}: { 
  message: string
  retry?: () => void 
}) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm text-red-200 font-medium">Error</p>
          <p className="text-sm text-red-300 mt-1">{message}</p>
          {retry && (
            <Button 
              onClick={retry}
              variant="ghost"
              size="sm"
              className="mt-3 text-sm text-red-400 hover:text-red-300 h-9 min-h-[36px]"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

