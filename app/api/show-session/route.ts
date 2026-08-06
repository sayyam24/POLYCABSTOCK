import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Please check your browser console or localStorage for session info',
    instructions: [
      '1. Open browser DevTools (F12)',
      '2. Go to Console tab',
      '3. Type: localStorage.getItem("electrotrack_session")',
      '4. Or go to Application tab → Local Storage → http://localhost:3000',
      '5. Look for keys containing "session" or "user"'
    ]
  })
}
