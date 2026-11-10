import {
  TavilyFeedbackOptions,
  TavilyFeedbackFunction,
  TavilyRequestConfig,
} from "./types";
import { createTransport } from "./transport";

export function _feedback(requestConfig: TavilyRequestConfig): TavilyFeedbackFunction {
  return async function feedback(options: TavilyFeedbackOptions) {
    // sessionId here is the past search session being reviewed (request body field
    // session_id), not the calling session tracked by X-Session-Id — unlike every
    // other method, it is intentionally NOT merged into callConfig below.
    const {
      sessionId,
      requestId,
      agentScore,
      humanScore,
      extraScores,
      comment,
      responseDelivered,
      usedUrls,
      usedIds,
      usedCitations,
      urlsScores,
      timeout,
      humanId,
      clientName,
      ...kwargs
    } = options;

    const requestTimeout = timeout ?? 10; // /feedback is a lightweight write (no search/crawl work), default to 10s
    const callConfig: TavilyRequestConfig = {
      ...requestConfig,
      ...(humanId !== undefined && { humanId }),
      ...(clientName !== undefined && { clientName }),
    };

    const data: any = await createTransport(callConfig).post(
      "feedback",
      {
        session_id: sessionId,
        request_id: requestId,
        agent_score: agentScore,
        human_score: humanScore,
        extra_scores: extraScores?.map((s) => ({ label: s.label, value: s.value })),
        comment,
        response_delivered: responseDelivered,
        used_urls: usedUrls,
        used_ids: usedIds,
        used_citations: usedCitations,
        urls_scores: urlsScores?.map((s) => ({
          id: s.id,
          url: s.url,
          agent_score: s.agentScore,
          scores: s.scores?.map((sc) => ({ label: sc.label, value: sc.value })),
          comment: s.comment,
        })),
        ...kwargs,
      },
      { timeoutSeconds: requestTimeout }
    );

    return {
      success: data.success,
      feedbackId: data.feedback_id,
      responseTime: data.response_time,
    };
  };
}
