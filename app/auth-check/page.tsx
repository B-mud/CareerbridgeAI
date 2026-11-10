"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function AuthCheckPage() {
  const { user, session, loading } = useAuth()
  const [backendStatus, setBackendStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [backendData, setBackendData] = useState<any>(null)

  const checkBackendAuth = useCallback(async () => {
    if (!session?.access_token) {
      setBackendStatus('error')
      return
    }

    try {
      setBackendStatus('checking')
      const response = await fetch('http://localhost:8000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBackendData(data)
        setBackendStatus('success')
      } else {
        setBackendStatus('error')
      }
    } catch (error) {
      console.error('Backend check failed:', error)
      setBackendStatus('error')
    }
  }, [session])

  useEffect(() => {
    checkBackendAuth()
  }, [checkBackendAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <h1 className="text-3xl font-bold text-center mb-8">🔍 Authentication Status Check</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Frontend Auth Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {user ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Frontend Authentication
              </CardTitle>
              <CardDescription>Supabase Auth Status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status:</p>
                <p className={`text-lg font-semibold ${user ? 'text-green-600' : 'text-red-600'}`}>
                  {user ? '✅ Authenticated' : '❌ Not Authenticated'}
                </p>
              </div>

              {user && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User ID:</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded break-all">{user.id}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email:</p>
                    <p className="text-sm">{user.email}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name:</p>
                    <p className="text-sm">{user.user_metadata?.name || 'Not set'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email Verified:</p>
                    <p className="text-sm">{user.email_confirmed_at ? '✅ Yes' : '⚠️ Pending'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At:</p>
                    <p className="text-sm">{new Date(user.created_at || '').toLocaleString()}</p>
                  </div>
                </>
              )}

              {!user && (
                <div className="space-y-2">
                  <Link href="/signup">
                    <Button className="w-full" variant="default">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/signin">
                    <Button className="w-full" variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backend Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {backendStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {backendStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                {backendStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                Backend Integration
              </CardTitle>
              <CardDescription>FastAPI Backend Status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status:</p>
                <p className={`text-lg font-semibold ${
                  backendStatus === 'success' ? 'text-green-600' : 
                  backendStatus === 'error' ? 'text-red-600' : 
                  'text-blue-600'
                }`}>
                  {backendStatus === 'success' && '✅ Connected'}
                  {backendStatus === 'error' && '❌ Not Connected'}
                  {backendStatus === 'checking' && '🔄 Checking...'}
                </p>
              </div>

              {backendData && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Backend User ID:</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded break-all">{backendData.id || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Database Status:</p>
                    <p className="text-sm">✅ User record exists in database</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resumes Uploaded:</p>
                    <p className="text-sm">{backendData.resumes_count || 0}</p>
                  </div>
                </>
              )}

              {backendStatus === 'error' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {!session ? 'Please sign in first' : 'Backend connection failed'}
                  </p>
                  {session && (
                    <Button onClick={checkBackendAuth} variant="outline" size="sm" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Connection
                    </Button>
                  )}
                </div>
              )}

              {backendStatus === 'checking' && (
                <p className="text-sm text-muted-foreground">Verifying backend connection...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Details */}
        {session && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>JWT Token Details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access Token (First 50 chars):</p>
                <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {session.access_token.substring(0, 50)}...
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Expires At:</p>
                <p className="text-sm">{new Date(session.expires_at! * 1000).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Provider:</p>
                <p className="text-sm">{session.user.app_metadata.provider || 'email'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 justify-center">
          {user && (
            <>
              <Link href="/dashboard">
                <Button size="lg">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/resume-upload">
                <Button size="lg" variant="outline">
                  Upload Resume
                </Button>
              </Link>
            </>
          )}
          <Link href="/">
            <Button size="lg" variant="ghost">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
