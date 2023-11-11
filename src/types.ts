export type CoachRole = "user" | "assistant" | "system" | "function";

export type CoachMessage = {
  role: CoachRole;
  content?: string;
};
