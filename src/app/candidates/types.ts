export type Status =
  | "PENDING"
  | "SELECTED"
  | "REJECTED"
  | "WAITLIST"
  | "INTERVIEW_TO_BE_SCHEDULED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_CANCELLED";

export type TextField =
  | "experience"
  | "currentCtc"
  | "expectedCtc"
  | "noticePeriod"
  | "location";

export interface Remark {
  id: string;
  text: string;
}

export interface Candidate {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  skillCategory: string | null;
  status: Status;
  statusReason: string | null;
  experience: string | null;
  currentCtc: string | null;
  expectedCtc: string | null;
  noticePeriod: string | null;
  location: string | null;
  workLinks: string[];
  remarks: Remark[];
  fileName: string;
  mimeType: string;
  createdAt: string;
  reviewedBy: { name: string } | null;
  uploadedBy: { id: string; name: string } | null;
}

export const STATUS_OPTIONS: Status[] = [
  "PENDING",
  "SELECTED",
  "REJECTED",
  "WAITLIST",
  "INTERVIEW_TO_BE_SCHEDULED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_CANCELLED",
];

export const STATUSES_REQUIRING_REASON = new Set<Status>([
  "REJECTED",
  "WAITLIST",
  "INTERVIEW_CANCELLED",
]);

export const ADD_NEW_CATEGORY = "__ADD_NEW__";

export const STATUS_LABELS: Record<Status, string> = {
  PENDING: "Pending",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  WAITLIST: "Waitlist",
  INTERVIEW_TO_BE_SCHEDULED: "Interview to be scheduled",
  INTERVIEW_SCHEDULED: "Interview scheduled",
  INTERVIEW_CANCELLED: "Interview cancelled",
};

export const STATUS_STYLES: Record<Status, string> = {
  PENDING: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
  SELECTED: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100",
  REJECTED: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
  WAITLIST: "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100",
  INTERVIEW_TO_BE_SCHEDULED: "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100",
  INTERVIEW_SCHEDULED: "bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100",
  INTERVIEW_CANCELLED: "bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100",
};
