"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Brain, RotateCcw, User } from "lucide-react"
import { SessionManager } from "@/lib/session-manager"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Navbar() {
  const { user, signOut } = useAuth()
  
  const handleNewSession = () => {
    SessionManager.clearUserData()
    window.location.href = '/get-started'
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || "User"

  return (
    <nav className="nav-container" role="navigation" aria-label="Main navigation">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
            <Link href="/" className="text-xl font-bold text-gradient hover:opacity-90 transition-opacity" aria-label="AI Career Mentor - Home">
              AI Career Mentor
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6" role="menubar">
            <Link href="/" className="nav-link" role="menuitem" aria-label="Go to Home page">
              Home
            </Link>
            {user && (
              <Link href="/dashboard" className="nav-link" role="menuitem" aria-label="Go to Dashboard">
                Dashboard
              </Link>
            )}
            <Link href="/features" className="nav-link" role="menuitem" aria-label="View Features">
              Features
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNewSession}
                className="text-muted-foreground hover:text-foreground"
                title="Start New Session"
                aria-label="Start a new session and reset profile"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.user_metadata?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/get-started">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600 dark:text-red-400">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
