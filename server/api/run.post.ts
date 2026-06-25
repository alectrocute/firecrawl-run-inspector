/**
 * POST /api/run — Instruments and executes a Firecrawl action sequence.
 *
 * ## Flow
 *
 *   Happy path (1 API call):
 *     Validate → instrument with screenshots → scrape → build timeline.
 *
 *   Failure path (2 API calls):
 *     Validate → instrument → scrape (fails) → classify → re-run prefix
 *     for the last-good screenshot.
 *
 *   Retry path:
 *     429 → exponential backoff (1s, 2s, 4s) → max 3 retries.
 */

import { Firecrawl } from '@mendable/firecrawl-js'
import type { ActionOption } from '@mendable/firecrawl-js'
import { z } from 'zod'
import { translate } from '#shared/utils/i18n'
import { resolveApiKey, isAuthError } from '../utils/apiKey'
import { instrumentActions, toUserStep, parseFailingActionIndex } from '../utils/instrument'
import { classifyActionError, diagnoseTransport } from '../utils/errors'
import { withRetry } from '../utils/retry'
import type {
  ActionsResult,
  ErrorClassification,
  ErrorCategory,
  RunResponse,
  RunWarning,
  StepStatus,
  TimelineStep,
  UserAction,
} from '~/types'

// ────────────────────────────────────────────────────────────────────────
// Zod schemas — API boundary validation
// ────────────────────────────────────────────────────────────────────────

const ActionSchema = z.object({
  type: z.enum([
    'wait',
    'click',
    'screenshot',
    'write',
    'press',
    'scroll',
    'scrape',
    'executeJavascript',
  ], { error: 'Invalid action type' }),
  selector: z.string()
    .max(1024, 'Selector must be at most 1024 characters')
    .optional(),
  milliseconds: z.number().positive().optional(),
  text: z.string().max(10_000).optional(),
  key: z.string().max(100).optional(),
  direction: z.enum(['up', 'down']).optional(),
  script: z.string().max(50_000).optional(),
  fullPage: z.boolean().optional(),
})

const RunRequestSchema = z.object({
  url: z.string()
    .url('Must be a valid URL (e.g. https://example.com)')
    .max(2048, 'URL must be at most 2048 characters')
    .refine((u) => u.startsWith('http://') || u.startsWith('https://'), {
      message: 'Only http and https URLs are supported',
    }),
  actions: z.array(ActionSchema).min(1, 'Add at least one action'),
  timeout: z.number().int().min(10_000).max(120_000).default(60_000).optional(),
})

// ────────────────────────────────────────────────────────────────────────
// Firecrawl result helpers
// ────────────────────────────────────────────────────────────────────────

function getActionsResult(result: unknown): ActionsResult {
  if (result && typeof result === 'object' && 'actions' in result) {
    return (result as { actions: ActionsResult }).actions
  }
  return {}
}

function isEmptyResult(r: ActionsResult): boolean {
  return (
    (r.screenshots?.length ?? 0) === 0 &&
    (r.scrapes?.length ?? 0) === 0 &&
    (r.javascriptReturns?.length ?? 0) === 0
  )
}

// ────────────────────────────────────────────────────────────────────────
// Timeline builders (pure functions)
// ────────────────────────────────────────────────────────────────────────

function buildSuccessSteps(
  userActions: UserAction[],
  screenshots: string[],
  empty: boolean,
): TimelineStep[] {
  const status: StepStatus = empty ? 'completed_empty' : 'succeeded'
  return userActions.map((action, i) => ({
    index: i,
    action,
    status,
    preStateScreenshotUrl: screenshots[i] || undefined,
    screenshotUrl: screenshots[i + 1] || undefined,
  }))
}

function buildFailureSteps(
  userActions: UserAction[],
  failingStep: number,
  errorMessage: string,
  classification: ErrorClassification,
  rawIndex: number | null,
): TimelineStep[] {
  return userActions.map((action, i) => {
    if (i < failingStep) return { index: i, action, status: 'succeeded' as const }
    if (i === failingStep) {
      return {
        index: i,
        action,
        status: 'failed' as const,
        error: {
          message: errorMessage,
          classification,
          rawActionIndex: rawIndex ?? undefined,
        },
      }
    }
    return { index: i, action, status: 'pending' as const }
  })
}

// ────────────────────────────────────────────────────────────────────────
// Warning helpers
// ────────────────────────────────────────────────────────────────────────

function warnScreenshotMismatch(
  warnings: RunWarning[],
  actual: number,
  expected: number,
) {
  if (actual > 0 && actual !== expected) {
    warnings.push({
      type: 'screenshot_count_mismatch',
      message: translate('warnings.screenshot_count_mismatch', { expected, actual }),
    })
  }
}

function warnEmpty(warnings: RunWarning[]) {
  warnings.push({
    type: 'empty_sequence',
    message: translate('warnings.empty_sequence'),
  })
}

function warnNetworkDropout(warnings: RunWarning[]) {
  warnings.push({
    type: 'partial_results',
    message: translate('warnings.partial_results'),
  })
}

// ────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()

  // ── Validate request body ──────────────────────────────────────────

  const parsed = RunRequestSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
    throw createError({
      statusCode: 400,
      statusMessage: translate('apiErrors.validation.statusMessage'),
      data: { category: 'validation' as ErrorCategory, fieldErrors },
      message: fieldErrors.map((e) => `${e.field}: ${e.message}`).join('; '),
    })
  }

  const { url, actions: userActions, timeout = 60_000 } = parsed.data

  // ── Resolve API key ─────────────────────────────────────────────────

  const apiKey = resolveApiKey(event)
  if (!apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: translate('apiErrors.missingKey.statusMessage'),
      message: translate('apiErrors.missingKey.message'),
    })
  }

  // ── Instrument & execute ────────────────────────────────────────────

  const fc = new Firecrawl({ apiKey })
  const profile = `run-inspector-${Date.now()}`
  const plan = instrumentActions(userActions)
  const warnings: RunWarning[] = []

  try {
    // ═════════════════════════════════════════════════════════════════
    // SUCCESS PATH
    // ═════════════════════════════════════════════════════════════════

    const { result, retries } = await withRetry(
      () =>
        fc.scrape(url, {
          formats: ['html'],
          actions: plan.actions as unknown as ActionOption[],
          profile: { name: profile, saveChanges: true },
          timeout,
        }),
    )

    const actionsResult = getActionsResult(result)
    const screenshots: string[] = actionsResult.screenshots ?? []

    warnScreenshotMismatch(warnings, screenshots.length, plan.screenshotCount)

    const empty = isEmptyResult(actionsResult)
    const steps = buildSuccessSteps(userActions, screenshots, empty)

    if (empty) warnEmpty(warnings)

    return {
      success: true,
      url,
      steps,
      initialScreenshotUrl: screenshots[0] || undefined,
      totalDurationMs: Date.now() - startedAt,
      warnings: warnings.length > 0 ? warnings : undefined,
      retries: retries.length > 0 ? retries : undefined,
    } satisfies RunResponse
  } catch (err: unknown) {
    // ═════════════════════════════════════════════════════════════════
    // FAILURE PATH
    // ═════════════════════════════════════════════════════════════════

    const { category, message: errorMessage, isRateLimited } =
      diagnoseTransport(err)

    // Bad credentials — surface immediately so the client discards the key
    if (isAuthError(errorMessage)) {
      throw createError({
        statusCode: 401,
        statusMessage: translate('apiErrors.invalidKey.statusMessage'),
        message: translate('apiErrors.invalidKey.message'),
      })
    }

    const rawIndex = parseFailingActionIndex(errorMessage)
    const userStep =
      rawIndex !== null
        ? toUserStep(rawIndex, plan.indexMap)
        : userActions.length - 1
    const classification: ErrorClassification = isRateLimited
      ? 'rate_limited'
      : classifyActionError(errorMessage)

    const steps = buildFailureSteps(
      userActions,
      userStep,
      errorMessage,
      classification,
      rawIndex,
    )

    // ── Prefix re-run for last-good screenshot ──────────────────────
    // Only attempt when we know the failing index and it's not network.
    // We time the re-run to detect race conditions: if the prefix timing
    // diverges significantly from the original, the page may have changed.

    if (rawIndex !== null && rawIndex > 0 && category !== 'network') {
      try {
        const prefix = plan.actions.slice(0, rawIndex)
        if (prefix.length > 0) {
          const prefixStart = Date.now()
          const prefixResult = await fc.scrape(url, {
            formats: ['html'],
            actions: prefix as unknown as ActionOption[],
            profile: { name: profile, saveChanges: false },
            timeout: 30_000,
          })
          const prefixDuration = Date.now() - prefixStart

          const prefixScreenshots =
            getActionsResult(prefixResult).screenshots ?? []
          const lastGood = prefixScreenshots[prefixScreenshots.length - 1]
          if (lastGood && userStep > 0) {
            steps[userStep - 1]!.screenshotUrl = lastGood
          }

          // Warn if the prefix re-run is significantly slower than
          // expected — being faster is normal (the failing step's timeout
          // overhead is absent from the prefix). Slowness may indicate the
          // page changed or is serving different content.
          const originalDuration = Date.now() - startedAt
          const prefixRatio = prefix.length / plan.actions.length
          const expectedMs = originalDuration * prefixRatio
          if (prefixDuration > expectedMs * 1.5) {
            const fmt = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
            warnings.push({
              type: 'prefix_timing_mismatch',
              message: translate('warnings.prefix_timing_mismatch', {
                prefixDuration: fmt(prefixDuration),
                expectedMs: fmt(expectedMs),
              }),
              stepIndex: userStep - 1,
            })
          }
        }
      } catch {
        // Prefix re-run failed — degrade gracefully
      }
    }

    if (category === 'network') warnNetworkDropout(warnings)

    return {
      success: false,
      url,
      steps,
      totalDurationMs: Date.now() - startedAt,
      warnings: warnings.length > 0 ? warnings : undefined,
      failure: {
        failedAtStep: userStep,
        totalSteps: userActions.length,
        message: errorMessage,
        classification,
        category,
      },
    } satisfies RunResponse
  }
})
