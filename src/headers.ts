/** Per-call identity headers for the typed client methods; only the options that are set. */
export function identityHeaders(opts: {
  sessionId?: string;
  humanId?: string;
  clientName?: string;
}): Record<string, string> {
  return {
    ...(opts.sessionId !== undefined && { "X-Session-Id": opts.sessionId }),
    ...(opts.humanId !== undefined && { "X-Human-Id": opts.humanId }),
    ...(opts.clientName !== undefined && { "X-Client-Name": opts.clientName }),
  };
}
