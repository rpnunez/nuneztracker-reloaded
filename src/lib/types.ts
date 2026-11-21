export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "datetime"
  | "select"
  | "checkbox"
  | "url";

export type ObjectField = {
  id: string;
  objectTypeId: string;
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required: boolean;
  sortOrder: number;
  builtin: boolean;
};

export type ObjectType = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  builtin: boolean;
  archived: boolean;
  statuses: string[];
};

export type RecordItem = {
  id: string;
  userId: string;
  objectTypeId: string;
  title: string;
  description: string;
  status: string;
  folder: string;
  dueAt: string | null;
  fieldValues: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  labelIds: string[];
};

export type Label = {
  id: string;
  userId: string;
  name: string;
  color: string;
};

export type AttachmentMeta = {
  id: string;
  recordId: string;
  filename: string;
  mime: string;
  createdAt: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  timezone: string;
  onboarded: boolean;
  checkInHours: string[];
  dueReminders: boolean;
  lastCheckinAt: string | null;
  points: number;
  streak: number;
  lastStreakDate: string | null;
  createdAt: string;
};

export type ScoreEvent = {
  id: string;
  userId: string;
  kind: string;
  points: number;
  note: string;
  createdAt: string;
};

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const BADGES: BadgeDef[] = [
  { id: "first-task", name: "First step", description: "Complete your first task", icon: "flag" },
  { id: "streak-7", name: "Week locked in", description: "7-day completion streak", icon: "flame" },
  { id: "tasks-25", name: "Twenty-five", description: "Complete 25 tasks", icon: "target" },
  { id: "points-100", name: "Century", description: "Earn 100 points", icon: "award" },
  { id: "on-time-week", name: "On-time week", description: "Finish 5 tasks on time", icon: "clock" },
];
