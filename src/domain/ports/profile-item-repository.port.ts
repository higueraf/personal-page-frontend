import { ProfileItem } from "../entities/profile-item.entity";

export interface ProfileItemRepositoryPort {
  // ── Admin ──
  list(params?: { type?: string }): Promise<ProfileItem[]>;
  create(body: Partial<ProfileItem>): Promise<ProfileItem>;
  update(id: string, body: Partial<ProfileItem>): Promise<ProfileItem>;
  delete(id: string): Promise<void>;

  // ── Público ──
  listPublic(params?: { type?: string }): Promise<ProfileItem[]>;
}
