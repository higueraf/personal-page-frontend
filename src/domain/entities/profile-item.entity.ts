export type ProfileItemType =
  | "EXPERIENCE"
  | "EDUCATION"
  | "CERTIFICATION"
  | "SKILL"
  | "LANGUAGE"
  | "AWARD"
  | "PUBLICATION"
  | "VOLUNTEER";

export interface ProfileItem {
  id: string;
  type: ProfileItemType;
  title: string;
  subtitle?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  tags?: string[];
  url?: string | null;
  logo?: string | null;
  order: number;
  is_visible: boolean;
  created_at?: string;
}
