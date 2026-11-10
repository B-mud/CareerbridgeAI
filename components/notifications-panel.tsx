"use client"

import Link from "next/link"
import { useState } from "react"
import { Bell, Home, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface Notification {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
  timestamp: Date
  actionText?: string
  onAction?: () => void
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const addNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
    }

    setNotifications((prev) => [newNotification, ...prev])

    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getBgColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      case "error":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
      default:
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
    }
  }

  const getTextColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "text-green-800 dark:text-green-200"
      case "error":
        return "text-red-800 dark:text-red-200"
      case "warning":
        return "text-yellow-800 dark:text-yellow-200"
      default:
        return "text-blue-800 dark:text-blue-200"
    }
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2" role="region" aria-label="Notifications" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border ${getBgColor(notification.type)} shadow-lg max-w-md animate-in fade-in slide-in-from-top-2 duration-300`}
          role="alert"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`font-semibold ${getTextColor(notification.type)}`}>{notification.title}</p>
              <p className={`text-sm mt-1 ${getTextColor(notification.type)} opacity-90`}>{notification.message}</p>
              {notification.actionText && notification.onAction && (
                <button
                  onClick={() => {
                    notification.onAction?.()
                    removeNotification(notification.id)
                  }}
                  className={`text-sm mt-2 font-semibold underline ${getTextColor(notification.type)} hover:opacity-75`}
                  aria-label={notification.actionText}
                >
                  {notification.actionText}
                </button>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`ml-4 ${getTextColor(notification.type)} hover:opacity-75`}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

let notificationCallback: ((notification: Omit<Notification, "id" | "timestamp">) => void) | null = null

export function setNotificationCallback(callback: (notification: Omit<Notification, "id" | "timestamp">) => void) {
  notificationCallback = callback
}

export function showNotification(notification: Omit<Notification, "id" | "timestamp">) {
  if (notificationCallback) {
    notificationCallback(notification)
  }
}
