import {
  disableCloudFirestore,
  isPermissionDeniedError,
} from '@/lib/firebase/runtime'

export async function runFirestore<T>(
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      disableCloudFirestore()
      return fallback
    }
    throw error
  }
}

export async function runFirestoreOrNull<T>(
  operation: () => Promise<T>,
): Promise<T | null> {
  return runFirestore(operation, null as T)
}
