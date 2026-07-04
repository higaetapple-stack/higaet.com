export type FeedbackEvent = {
  prediction: "ALLOW" | "BLOCK" | "WARN";
  actual: "ALLOW" | "DENY" | "ERROR";
};

export type FeedbackAdjustment = {
  adjustment:
    | "INCREASE_RESTRICTIVENESS_WEIGHT"
    | "REDUCE_RESTRICTIVENESS_WEIGHT"
    | "NO_CHANGE";
};

export function applyOutcomeFeedback(event: FeedbackEvent): FeedbackAdjustment {
  if (event.prediction === "ALLOW" && event.actual === "ERROR") {
    return { adjustment: "INCREASE_RESTRICTIVENESS_WEIGHT" };
  }
  if (event.prediction === "BLOCK" && event.actual === "ALLOW") {
    return { adjustment: "REDUCE_RESTRICTIVENESS_WEIGHT" };
  }
  return { adjustment: "NO_CHANGE" };
}
