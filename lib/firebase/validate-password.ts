export function validateNewPassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  if (password.length > 128) {
    return 'Password must be 128 characters or fewer'
  }
  return null
}
