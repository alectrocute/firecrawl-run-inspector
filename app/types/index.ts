// ── Shared types for Run Inspector ───────────────────────────────────
// These are used by both server/api/run.post.ts and the Vue components.

/** The action types Firecrawl supports in the actions array. */
export type ActionType =
  | 'wait'
  | 'click'
  | 'screenshot'
  | 'write'
  | 'press'
  | 'scroll'
  | 'scrape'
  | 'executeJavascript';

/** A user-defined action in the actions array. */
export interface UserAction {
  type: ActionType;
  selector?: string;
  milliseconds?: number;
  text?: string;
  key?: string;
  direction?: 'up' | 'down';
  script?: string;
  fullPage?: boolean;
}

// ── Step status ──────────────────────────────────────────────────────

export type StepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'completed_empty' | 'skeleton';

// ── Error classification ─────────────────────────────────────────────

export type ErrorClassification =
  | 'selector_not_found'
  | 'wait_timeout'
  | 'navigation_timeout'
  | 'api_timeout'
  | 'rate_limited'
  | 'blocked'
  | 'empty_result'
  | 'unknown';

/** Top-level error category for distinguishing UI messaging. */
export type ErrorCategory = 'network' | 'api' | 'sdk' | 'validation';

// ── Timeline ─────────────────────────────────────────────────────────

export interface TimelineStep {
  /** 0-based index in the user's original actions array */
  index: number;
  /** The user's action definition */
  action: UserAction;
  status: StepStatus;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Screenshot URL showing page state AFTER this step completed */
  screenshotUrl?: string;
  /** For the initial pre-state screenshot (before any user action) */
  preStateScreenshotUrl?: string;
  /** Error details if status is 'failed' */
  error?: {
    message: string;
    classification: ErrorClassification;
    rawActionIndex?: number;
  };
}

// ── Warnings ─────────────────────────────────────────────────────────

export interface RunWarning {
  type: 'screenshot_count_mismatch' | 'partial_results' | 'empty_sequence' | 'prefix_timing_mismatch';
  message: string;
  /** Which step this warning relates to, if applicable */
  stepIndex?: number;
}

// ── Retries ──────────────────────────────────────────────────────────

export interface RetryAnnotation {
  attempt: number;
  delayMs: number;
  reason: string;
}

// ── API response ─────────────────────────────────────────────────────

export interface RunResponse {
  success: boolean;
  /** The original URL */
  url: string;
  /** One timeline step per user action */
  steps: TimelineStep[];
  /** Initial page state screenshot */
  initialScreenshotUrl?: string;
  /** Total execution time in ms */
  totalDurationMs: number;
  /** If the run failed, summary info */
  failure?: {
    failedAtStep: number;
    totalSteps: number;
    message: string;
    classification: ErrorClassification;
    /** Top-level category for UI messaging */
    category?: ErrorCategory;
  };
  /** Non-fatal warnings from the run */
  warnings?: RunWarning[];
  /** Retry attempts made (only populated when rate-limited) */
  retries?: RetryAnnotation[];
}

// ── Validation error (field-level) ───────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

// ── Editor presets ───────────────────────────────────────────────────

export interface Preset {
  id: string;
  name: string;
  description: string;
  url: string;
  actions: UserAction[];
}

// ── UI tone tokens (presentational) ──────────────────────────────────

/** Semantic colour tone shared by badges, alerts, dots, etc. */
export type Tone = 'neutral' | 'ember' | 'success' | 'danger' | 'warning';

/** High-level state of a run, surfaced in the inspect header. */
export type RunStatusTone = 'idle' | 'running' | 'passed' | 'failed' | 'error';

// ── Error presentation (derived by useRunInspector) ────────────────────

/** Presentational view for each transport-error category. */
export interface ErrorView {
  tone: Tone
  title: string
  body: string
  hint?: string
}

// ── Form ─────────────────────────────────────────────────────────────

/** A validated action-editor submission, ready to send to the run endpoint. */
export interface RunPayload {
  url: string;
  actions: UserAction[];
}

// ── Presentational UI tokens ─────────────────────────────────────────

/** Available line-icon names rendered by the `UiIcon` component. */
export type IconName =
  | 'check'
  | 'x'
  | 'alert'
  | 'info'
  | 'search'
  | 'compass'
  | 'scan'
  | 'refresh'
  | 'clipboard'
  | 'play'
  | 'arrowLeft'
  | 'arrowRight'
  | 'chevronDown'
  | 'list'
  | 'flame';

/** A panel corner, used for the blueprint crosshair decorations. */
export type Corner = 'tl' | 'tr' | 'bl' | 'br';

// ── Server-internal contracts ────────────────────────────────────────
// Produced and consumed on the server; kept here so the type registry is
// the single source of truth for the whole app.

/** Output of `instrumentActions` — the screenshot-woven sequence + index map. */
export interface InstrumentPlan {
  /** The full instrumented action sequence ready to submit to Firecrawl. */
  actions: UserAction[];
  /** Maps each instrumented index back to its originating user-action index. */
  indexMap: Map<number, number>;
  /** Exact number of screenshot actions in the instrumented sequence. */
  screenshotCount: number;
}

/** The `actions` block of a Firecrawl scrape result. */
export interface ActionsResult {
  screenshots?: string[];
  scrapes?: Array<{ url: string; html: string }>;
  javascriptReturns?: Array<{ type: string; value: unknown }>;
}

/** Transport-level categorisation of a thrown request error. */
export interface TransportDiagnosis {
  category: ErrorCategory;
  message: string;
  isRateLimited: boolean;
}

/** Result of the startup Firecrawl error-format verification. */
export interface VerificationStatus {
  checked: boolean;
  ok: boolean;
  message: string;
}
