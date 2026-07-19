import { ContactInfo, ContactMessage, ContactMessageStatus } from "../entities/contact.entity";
import { Paginated } from "../shared/pagination";

export interface ContactRepositoryPort {
  // ── Admin: info de contacto ──
  listInfo(): Promise<ContactInfo[]>;
  upsertInfo(body: Partial<ContactInfo>): Promise<ContactInfo>;
  updateInfo(id: string, body: Partial<ContactInfo>): Promise<ContactInfo>;

  // ── Admin: mensajes ──
  listMessages(params?: { status?: string; page?: number }): Promise<Paginated<ContactMessage>>;
  getMessage(id: string): Promise<ContactMessage>;
  updateMessageStatus(id: string, status: ContactMessageStatus): Promise<ContactMessage>;

  // ── Público ──
  getPublicInfo(): Promise<ContactInfo[]>;
  sendMessage(body: { name: string; email: string; phone?: string; subject: string; message: string }): Promise<{ id: string; ok: boolean }>;
}
