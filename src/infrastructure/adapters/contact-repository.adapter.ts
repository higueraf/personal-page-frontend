import axiosClient from "../http/axios-client";
import { ContactRepositoryPort } from "../../domain/ports/contact-repository.port";
import { ContactInfo, ContactMessage, ContactMessageStatus } from "../../domain/entities/contact.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosContactRepositoryAdapter implements ContactRepositoryPort {
  // ── Admin: info de contacto ──
  async listInfo(): Promise<ContactInfo[]> {
    const { data } = await axiosClient.get<{ data: ContactInfo[] }>("/contact/info");
    return data.data;
  }

  async upsertInfo(body: Partial<ContactInfo>): Promise<ContactInfo> {
    const { data } = await axiosClient.post<{ data: ContactInfo }>("/contact/info", body);
    return data.data;
  }

  async updateInfo(id: string, body: Partial<ContactInfo>): Promise<ContactInfo> {
    const { data } = await axiosClient.patch<{ data: ContactInfo }>(`/contact/info/${id}`, body);
    return data.data;
  }

  // ── Admin: mensajes ──
  async listMessages(params?: { status?: string; page?: number }): Promise<Paginated<ContactMessage>> {
    const { data } = await axiosClient.get<Paginated<ContactMessage>>("/contact/messages", { params });
    return data;
  }

  async getMessage(id: string): Promise<ContactMessage> {
    const { data } = await axiosClient.get<{ data: ContactMessage }>(`/contact/messages/${id}`);
    return data.data;
  }

  async updateMessageStatus(id: string, status: ContactMessageStatus): Promise<ContactMessage> {
    const { data } = await axiosClient.patch<{ data: ContactMessage }>(`/contact/messages/${id}`, { status });
    return data.data;
  }

  // ── Público ──
  async getPublicInfo(): Promise<ContactInfo[]> {
    const { data } = await axiosClient.get<{ data: ContactInfo[] }>("/public/contact/info");
    return data.data;
  }

  async sendMessage(body: { name: string; email: string; phone?: string; subject: string; message: string }): Promise<{ id: string; ok: boolean }> {
    const { data } = await axiosClient.post<{ data: { id: string; ok: boolean } }>("/public/contact/message", body);
    return data.data;
  }
}
