/**
 * Error types thrown by the Tavily SDK.
 */

/** An entry of the keyless-limit envelope's `next_actions`, as the API sends it. */
export type TavilyContinuationPath = {
  type: "signup" | "agentic_payment" | "bonus_credits";
  resource?: string;
  instruction?: string;
  eligible?: boolean;
  [key: string]: unknown;
};

/**
 * Thrown when a keyless request is rejected by the Tavily API — for example
 * when an hourly, daily, or monthly cap has been reached, or when the
 * requested endpoint is not available without an API key.
 */
export class TavilyKeylessLimitError extends Error {
  public readonly capType: string;
  public readonly retryAfter: number | null;
  public readonly bonusEligible: boolean;
  public readonly continuationPaths: TavilyContinuationPath[];
  /** The cap's window as the API names it (for example "hour"), or null when absent. */
  public readonly window: string | null;

  constructor(params: {
    message: string;
    capType: string;
    retryAfter: number | null;
    bonusEligible: boolean;
    continuationPaths: TavilyContinuationPath[];
    window?: string | null;
  }) {
    super(params.message);
    this.name = "TavilyKeylessLimitError";
    this.capType = params.capType;
    this.retryAfter = params.retryAfter;
    this.bonusEligible = params.bonusEligible;
    this.continuationPaths = params.continuationPaths;
    this.window = params.window ?? null;

    Object.setPrototypeOf(this, TavilyKeylessLimitError.prototype);
  }
}

export function isKeylessLimitEnvelope(data: any): boolean {
  return !!(
    data &&
    typeof data === "object" &&
    data.error &&
    typeof data.error === "object" &&
    typeof data.error.code === "string" &&
    Array.isArray(data.error.next_actions)
  );
}

export function keylessLimitErrorFromEnvelope(
  data: any
): TavilyKeylessLimitError {
  const err = data.error ?? {};
  const nextActions: TavilyContinuationPath[] = Array.isArray(err.next_actions)
    ? err.next_actions
    : [];
  const bonusEligible = nextActions.some(
    (a: any) => a?.type === "bonus_credits" && a?.eligible === true
  );

  return new TavilyKeylessLimitError({
    message: typeof err.message === "string" ? err.message : String(err.code),
    capType: String(err.code),
    retryAfter:
      typeof err.retry_after_seconds === "number"
        ? err.retry_after_seconds
        : null,
    bonusEligible,
    continuationPaths: nextActions,
    window: typeof err.window === "string" ? err.window : null,
  });
}

/**
 * Thrown for any non-2xx Tavily API response other than a keyless-limit
 * envelope. Carries the HTTP status and the parsed body.
 */
export class TavilyRequestError extends Error {
  public readonly status: number;
  public readonly body: unknown;
  public readonly docs?: string;

  constructor(params: {
    message: string;
    status: number;
    body: unknown;
    docs?: string;
  }) {
    super(params.message);
    this.name = "TavilyRequestError";
    this.status = params.status;
    this.body = params.body;
    this.docs = params.docs;

    Object.setPrototypeOf(this, TavilyRequestError.prototype);
  }
}
