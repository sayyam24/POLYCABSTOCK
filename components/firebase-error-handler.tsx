'use client'

import { useEffect } from 'react'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import {
  disableCloudFirestore,
  isPermissionDeniedError,
} from '@/lib/firebase/runtime'

/** Catches unhandled Firebase permission rejections (e.g. on page load). */
export function FirebaseErrorHandler() {
  useEffect(() => {
    if (!isFirebaseConfigured()) return

    const onRejection = (event: PromiseRejectionEvent) => {
      if (!isPermissionDeniedError(event.reason)) return
      event.preventDefault()
      disableCloudFirestore()
    }

    window.addEventListener('unhandledrejection', onRejection)
    return () => window.removeEventListener('unhandledrejection', onRejection)
  }, [])

  return null
}
