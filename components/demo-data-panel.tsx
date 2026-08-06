'use client'

import { useState } from 'react'
import { Database, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/components/store-provider'
import {
  generateAndApplyDemoData,
  isDemoSeededLocally,
  resetAllDemoData,
} from '@/lib/demo/persist'
import { DEMO_COUNTS, DEMO_PASSWORD } from '@/lib/demo/constants'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { toast } from 'sonner'

export function DemoDataPanel() {
  const { refresh } = useStore()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [seeded, setSeeded] = useState(isDemoSeededLocally())

  if (process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo') {
    return null
  }

  const handleGenerate = async () => {
    setLoading(true)
    setProgress('Generating ERP demo dataset…')
    try {
      await generateAndApplyDemoData({
        firebase: isFirebaseConfigured(),
        onProgress: setProgress,
      })
      setSeeded(true)
      refresh()
      toast.success('Demo data generated', {
        description: `${DEMO_COUNTS.depos} depos, ${DEMO_COUNTS.distributors} distributors, ${DEMO_COUNTS.subDistributors} sub distributors, ${DEMO_COUNTS.retailers} retailers`,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset all demo data? This removes generated users, stock, and shipments.')) {
      return
    }
    setLoading(true)
    setProgress('Resetting…')
    try {
      await resetAllDemoData({
        firebase: isFirebaseConfigured(),
        onProgress: setProgress,
      })
      setSeeded(false)
      refresh()
      toast.info('Demo data reset')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Demo Data Generator
        </CardTitle>
        <CardDescription>
          Auto-build the full supply chain: users, products, opening stock, shipments,
          notifications, and transaction history. No manual entry required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
          <div className="rounded-lg bg-background p-3 border">
            <p className="text-2xl font-bold">{DEMO_COUNTS.depos}</p>
            <p className="text-muted-foreground text-xs">Depos</p>
          </div>
          <div className="rounded-lg bg-background p-3 border">
            <p className="text-2xl font-bold">{DEMO_COUNTS.distributors}</p>
            <p className="text-muted-foreground text-xs">Distributors</p>
          </div>
          <div className="rounded-lg bg-background p-3 border">
            <p className="text-2xl font-bold">{DEMO_COUNTS.subDistributors}</p>
            <p className="text-muted-foreground text-xs">Sub Dist.</p>
          </div>
          <div className="rounded-lg bg-background p-3 border">
            <p className="text-2xl font-bold">{DEMO_COUNTS.retailers}</p>
            <p className="text-muted-foreground text-xs">Retailers</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Demo login password for all generated accounts:{' '}
          <code className="font-mono bg-muted px-1 rounded">{DEMO_PASSWORD}</code>
          <br />
          Emails: <code className="font-mono">depo1@demo.electrotrack.com</code>,{' '}
          <code className="font-mono">distributor1@…</code>, etc.
        </p>

        {seeded && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Demo dataset is active. Sign in as any demo user with role auto-detect.
          </p>
        )}

        {progress && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {progress}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Demo Data
          </Button>
          <Button size="lg" variant="outline" onClick={handleReset} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Demo Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
