/**
 * Action instrumentation — weaves screenshot actions between user actions so
 * every step has a before/after picture for the timeline.
 *
 * Pattern for N user actions with K screenshot actions among them:
 *   [ss₀, action₀, ss₁, …, actionₙ₋₁, ssₙ]
 *
 * When a user action is itself a screenshot we skip the wrapper after it —
 * the action already captures the post-state.
 */

import type { InstrumentPlan, UserAction } from '~/types'

// ── Instrument ─────────────────────────────────────────────────────────

export function instrumentActions(userActions: UserAction[]): InstrumentPlan {
  const actions: UserAction[] = []
  const indexMap = new Map<number, number>()

  // ss₀ — page state before any user action runs
  actions.push({ type: 'screenshot' })
  indexMap.set(0, -1)

  for (let i = 0; i < userActions.length; i++) {
    const action = userActions[i]!

    actions.push(action)
    indexMap.set(actions.length - 1, i)

    if (action.type !== 'screenshot') {
      actions.push({ type: 'screenshot' })
      indexMap.set(actions.length - 1, i)
    }
  }

  return {
    actions,
    indexMap,
    screenshotCount: actions.filter((a) => a.type === 'screenshot').length,
  }
}

// ── Index lookup ───────────────────────────────────────────────────────

/** Convert a Firecrawl-reported action index back to a user step. */
export function toUserStep(
  instrumentedIndex: number,
  indexMap: Map<number, number>,
): number {
  return indexMap.get(instrumentedIndex) ?? 0
}

// ── Error parsing ──────────────────────────────────────────────────────

/** Extract the failing action index from a Firecrawl error message. */
export function parseFailingActionIndex(message: string): number | null {
  const match = message.match(/action\s+(\d+)/i)
  return match?.[1] ? parseInt(match[1], 10) : null
}
