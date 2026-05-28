/**
 * Error types thrown by the Tavily SDK.
 */

export type TavilyContinuationPath =
  | {
      type: "agentic_payment";
      scheme?: string;
      details?: string;
      [key: string]: any;
    }
  | {
      type: "signup";
      url?: string;
      [key: string]: any;
    }
  | {
      type: "bonus_credits";
      eligible?: boolean;
      endpoint?: string;
      questions?: string[];
      credits_on_completion?: number;
      reason?: string;
      [key: string]: any;
    }
  | { type: string; [key: string]: any };

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

  constructor(params: {
    message: string;
    capType: string;
    retryAfter: number | null;
    bonusEligible: boolean;
    continuationPaths: TavilyContinuationPath[];
  }) {
    super(params.message);
    this.name = "TavilyKeylessLimitError";
    this.capType = params.capType;
    this.retryAfter = params.retryAfter;
    this.bonusEligible = params.bonusEligible;
    this.continuationPaths = params.continuationPaths;

    Object.setPrototypeOf(this, TavilyKeylessLimitError.prototype);
  }
}

export function isKeylessLimitEnvelope(data: any): boolean {
  return !!(
    data &&
    typeof data === "object" &&
    data.error &&
    typeof data.error === "object" &&
    typeof data.error.code === "string"
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
  });
}
