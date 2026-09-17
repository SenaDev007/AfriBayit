'use client'

/**
 * KeepWarmBeacon — in-session Neon keep-warm ping.
 *
 * Neon's free tier suspends the database compute after ~5 minutes of
 * inactivity, and waking it up takes ~10 seconds. Without this beacon, a
 * visitor who lands on the site and then navigates (or keeps a tab open for
 * a while) hits a re-suspended database mid-session: page-to-page navigation
 * suddenly shows spinners again or, worse, "Erreur de chargement".
 *
 * While the tab is VISIBLE, ping /api/keep-warm every 4 minutes so the
 * database stays awake for the whole session. The ping is a fire-and-forget
 * `SELECT 1` (a few bytes) — negligible cost, no auth, never cached.
 *
 * Rendering: null — this component has no visual footprint.
 */

import { useEffect } from 'react'

// Neon free tier auto-suspend delay is ~5 minutes; ping every 4 minutes.
const KEEP_WARM_INTERVAL_MS = 4 * 60 * 1000

export default function KeepWarmBeacon() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return

    let timer: ReturnType<typeof setInterval> | null = null

    const ping = () => {
      // Only keep the database warm while the visitor is actually on the tab.
      if (document.visibilityState !== 'visible') return
      // keepalive: the ping must survive navigation/unload of the page.
      fetch('/api/keep-warm', { cache: 'no-store', keepalive: true }).catch(
        () => {
          /* completely non-critical — next interval retries */
        },
      )
    }

    const start = () => {
      if (timer === null) timer = setInterval(ping, KEEP_WARM_INTERVAL_MS)
    }

    const stop = () => {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping() // immediate refresh of the wake-up state on tab return
        start()
      } else {
        stop() // background tab: let the DB sleep, nobody is watching
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return null
}
