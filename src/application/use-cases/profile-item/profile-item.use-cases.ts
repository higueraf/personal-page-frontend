import { ProfileItemRepositoryPort } from "../../../domain/ports/profile-item-repository.port";
import { ProfileItem } from "../../../domain/entities/profile-item.entity";

export class ProfileItemUseCases {
  constructor(private readonly repository: ProfileItemRepositoryPort) {}

  list(params?: { type?: string }): Promise<ProfileItem[]> {
    return this.repository.list(params);
  }

  create(body: Partial<ProfileItem>): Promise<ProfileItem> {
    return this.repository.create(body);
  }

  update(id: string, body: Partial<ProfileItem>): Promise<ProfileItem> {
    return this.repository.update(id, body);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  listPublic(params?: { type?: string }): Promise<ProfileItem[]> {
    return this.repository.listPublic(params);
  }
}
