export interface Role {
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string | null;
  role?: Role;
  permissions?: string[];
  status?: string;
  is_active?: boolean;
  full_name?: string;
  username?: string;
}
