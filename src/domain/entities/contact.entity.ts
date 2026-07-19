export type ContactMessageStatus = "PENDING" | "READ" | "REPLIED";

export interface ContactInfo {
  id: string;
  key: string;
  label: string;
  value: string;
  icon?: string | null;
  is_visible: boolean;
  order: number;
  updated_at?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
  updated_at?: string;
}
