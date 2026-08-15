import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { FirebaseErrorHandler } from '@/components/firebase-error-handler'
import { StoreProvider } from '@/components/store-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ElectroTrack - Electronics Stock Management',
  description: 'Modern SaaS platform for managing electronics inventory across Distributor, Sub-Distributor, and Retailer supply chain',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.className} font-sans antialiased`}>
        <AuthProvider>
          <FirebaseErrorHandler />
          <StoreProvider>{children}</StoreProvider>
          <Toaster richColors position="top-right" />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
