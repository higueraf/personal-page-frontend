export type UserStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
export type UserType = "student" | "public";

export interface AdminRole {
  id: string;
  name: string;
}

export interface AdminInstitution {
  id: string;
  name: string;
}

export interface AdminStudyCourse {
  id: string;
  name: string;
  institution_id?: string | null;
}

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
  is_active: boolean;
  user_type: UserType;
  role: AdminRole | null;
  institution: AdminInstitution | null;
  study_courses: AdminStudyCourse[];
  created_at: string;
}
