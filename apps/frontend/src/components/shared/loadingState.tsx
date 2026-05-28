import React from 'react'

import { Shield } from 'lucide-react'

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="bg-primary/10 border-primary/20 flex h-12 w-12 animate-pulse items-center justify-center rounded-xl border">
          <Shield className="text-primary h-6 w-6" />
        </div>
      </div>
      <p className="text-muted-foreground mt-4 text-sm">{message}</p>
    </div>
  )
}
