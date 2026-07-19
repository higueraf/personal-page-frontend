import { ContactRepositoryPort } from "../../../domain/ports/contact-repository.port";
import { ContactInfo, ContactMessage, ContactMessageStatus } from "../../../domain/entities/contact.entity";
import { Paginated } from "../../../domain/shared/pagination";

export class ContactUseCases {
  constructor(private readonly repository: ContactRepositoryPort) {}

  listInfo(): Promise<ContactInfo[]> {
    return this.repository.listInfo();
  }

  upsertInfo(body: Partial<ContactInfo>): Promise<ContactInfo> {
    return this.repository.upsertInfo(body);
  }

  updateInfo(id: string, body: Partial<ContactInfo>): Promise<ContactInfo> {
    return this.repository.updateInfo(id, body);
  }

  listMessages(params?: { status?: string; page?: number }): Promise<Paginated<ContactMessage>> {
    return this.repository.listMessages(params);
  }

  getMessage(id: string): Promise<ContactMessage> {
    return this.repository.getMessage(id);
  }

  updateMessageStatus(id: string, status: ContactMessageStatus): Promise<ContactMessage> {
    return this.repository.updateMessageStatus(id, status);
  }

  getPublicInfo(): Promise<ContactInfo[]> {
    return this.repository.getPublicInfo();
  }

  sendMessage(body: { name: string; email: string; phone?: string; subject: string; message: string }): Promise<{ id: string; ok: boolean }> {
    return this.repository.sendMessage(body);
  }
}
