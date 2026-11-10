import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type ActivityPayload = {
  action_type: string
  details?: Record<string, unknown>
}

export async function logUserActivity(payload: ActivityPayload): Promise<void> {
  try {
    const supabase = createClientComponentClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token
    const userId = session?.user?.id

    if (!token || !userId) {
      return
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("user_id", userId)
    }

    await fetch("http://localhost:8000/api/activity/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        action_type: payload.action_type,
        details: payload.details || {},
      }),
    })

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("activity:logged", { detail: payload }))
    }
  } catch {
    // Non-blocking telemetry call
  }
}
