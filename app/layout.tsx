import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { QuickActionsFAB } from "@/components/quick-actions-fab"
import { NotificationsPanel } from "@/components/notifications-panel"
import { GlobalLoading } from "@/components/global-loading"
import localFont from 'next/font/local'
import "./globals.css"

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: "AI-Powered Career Mentor | Resume Skill Analyzer",
  description:
    "Upload your resume, discover skill gaps, get personalized recommendations and mock tests to advance your career.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="aicareermentor-theme"
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <GlobalLoading />
            <Suspense fallback={null}>{children}</Suspense>
            <QuickActionsFAB />
            <NotificationsPanel />
          </AuthProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
