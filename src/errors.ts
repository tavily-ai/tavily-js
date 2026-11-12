/**
 * Error types thrown by the Tavily SDK.
 */

/**
 * An entry of the keyless-limit envelope's `next_actions`, as the API sends it. A
 * `bonus_credits` action carries `params: { questions: string[]; credits_on_completion: number }`.
 */
export type TavilyContinuationPath = {
  type: "signup" | "agentic_payment" | "bonus_credits" | (string & {});
  resource?: string;
  instruction?: string;
  params?: Record<string, unknown>;
  [key: string]: any;
};

/**
 * Thrown for any non-2xx Tavily API response other than a keyless-limit
 * envelope. Carries the HTTP status and the parsed body.
 */
export class TavilyRequestError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(params: { message: string; status: number; body: unknown }) {
    super(params.message);
    this.name = "TavilyRequestError";
    this.status = params.status;
    this.body = params.body;

    Object.setPrototypeOf(this, TavilyRequestError.prototype);
  }
}

/**
 * Thrown when the Tavily API answers with a keyless-limit envelope. The server uses it
 * for several statuses; `capType` is the envelope's `error.code`:
 *
 * | status | code |
 * |---|---|
 * | 429 | `hourly_cap_reached`, `daily_cap_reached`, `monthly_cap_reached_*` |
 * | 401 | `api_key_required` |
 * | 403 | `abuse_blocked` |
 * | 404 | `unsupported_endpoint` |
 * | 503 | `service_unavailable` |
 */
export class TavilyKeylessLimitError extends TavilyRequestError {
  public readonly capType: string;
  public readonly retryAfter: number | null;
  /** True when the envelope offers a `bonus_credits` continuation path. */
  public readonly bonusEligible: boolean;
  public readonly continuationPaths: TavilyContinuationPath[];
  /** The cap's window as the API names it (for example "hour"), or null when absent. */
  public readonly window: string | null;

  constructor(params: {
    message: string;
    status: number;
    body: unknown;
    capType: string;
    retryAfter: number | null;
    bonusEligible: boolean;
    continuationPaths: TavilyContinuationPath[];
    window?: string | null;
  }) {
    super(params);
    this.name = "TavilyKeylessLimitError";
    this.capType = params.capType;
    this.retryAfter = params.retryAfter;
    this.bonusEligible = params.bonusEligible;
    this.continuationPaths = params.continuationPaths;
    this.window = params.window ?? null;

    Object.setPrototypeOf(this, TavilyKeylessLimitError.prototype);
  }
}

type KeylessLimitEnvelope = {
  error: {
    code: string;
    message?: unknown;
    window?: unknown;
    retry_after_seconds?: unknown;
    next_actions: TavilyContinuationPath[];
  };
};

export function isKeylessLimitEnvelope(data: unknown): data is KeylessLimitEnvelope {
  const error = (data as { error?: unknown } | null)?.error as
    | { code?: unknown; next_actions?: unknown }
    | undefined;
  return (
    typeof error === "object" &&
    error !== null &&
    typeof error.code === "string" &&
    Array.isArray(error.next_actions)
  );
}

export function keylessLimitErrorFromEnvelope(
  data: KeylessLimitEnvelope,
  status: number
): TavilyKeylessLimitError {
  const err = data.error;
  return new TavilyKeylessLimitError({
    message: typeof err.message === "string" ? err.message : err.code,
    status,
    body: data,
    capType: err.code,
    retryAfter: typeof err.retry_after_seconds === "number" ? err.retry_after_seconds : null,
    bonusEligible: err.next_actions.some((a) => a?.type === "bonus_credits"),
    continuationPaths: err.next_actions,
    window: typeof err.window === "string" ? err.window : null,
  });
}
