const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

/**
 * Wraps fetch so the gateway-minted run id is captured and resent on later calls.
 */
export function createLovableAiGatewayRunIdFetch(initialRunId?: string | undefined) {
  let runId = initialRunId;
  const wrapped: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set(RUN_ID_HEADER, runId);
    const response = await fetch(input, { ...init, headers });
    const minted = response.headers.get(RUN_ID_HEADER);
    if (minted) runId = minted;
    return response;
  };
  return {
    fetch: wrapped,
    get runId() {
      return runId;
    },
  };
}

export function getLovableAiGatewayRunId(request: Request) {
  return request.headers.get(RUN_ID_HEADER) ?? undefined;
}

export function withLovableAiGatewayRunIdHeader(response: Response, runIdFetch: { runId: string | undefined }) {
  if (!runIdFetch.runId) return response;
  const headers = new Headers(response.headers);
  headers.set(RUN_ID_HEADER, runIdFetch.runId);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
