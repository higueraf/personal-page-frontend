export interface AdminPlayground {
  id: string;
  name: string;
  type: string;
  language: string;
  is_exam: boolean;
  created_at: string;
  user?: { id: string; first_name: string; last_name: string; email: string };
}
