export const LIFECYCLE_STAGES = [
  "Subscriber",
  "Engaged",
  "Hot",
  "In Conversation",
  "Client",
  "Dormant",
  "Do Not Contact",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LEAD_SOURCES = [
  "Website",
  "Referral",
  "LinkedIn",
  "Webinar",
  "Trade Show",
  "Cold Outreach",
  "Newsletter",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  stage: LifecycleStage;
  source: LeadSource;
  owner: string;
  dealValue: number;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
}

export const TASK_TYPES = ["Call", "Email", "Meeting", "Follow-up", "To-do"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  contactId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type ActivityType =
  | "contact_created"
  | "contact_updated"
  | "contact_deleted"
  | "stage_changed"
  | "note_added"
  | "task_created"
  | "task_completed"
  | "task_reopened"
  | "task_deleted"
  | "email_sent"
  | "call_logged"
  | "meeting_held";

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  contactId: string | null;
  timestamp: string;
}

export type ContactInput = Omit<
  Contact,
  "id" | "notes" | "createdAt" | "updatedAt" | "lastContactedAt"
> & { initialNote?: string };

export type TaskInput = Omit<Task, "id" | "createdAt" | "completedAt" | "completed">;

export const SALES_REPS = ["Alex Morgan", "Jordan Lee", "Priya Shah", "Sam Carter"] as const;
