import type { Metadata, Viewport } from 'next'
import { Poppins, Righteous, Geist } from 'next/font/google'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ToastContainer } from '@/components/ui/toast-container'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const righteous = Righteous({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-righteous',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dranklijst',
  description: 'Consumptie-registratie voor jeugdbewegingen',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dranklijst',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl" className={cn(poppins.variable, righteous.variable, "font-sans", geist.variable)}>
      <body>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  )
}
