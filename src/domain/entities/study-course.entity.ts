import { Institution } from "./institution.entity";

export interface StudyCourse {
  id: string;
  name: string;
  description?: string | null;
  institution?: Institution | null;
  institution_id?: string;
  created_at?: string;
}
