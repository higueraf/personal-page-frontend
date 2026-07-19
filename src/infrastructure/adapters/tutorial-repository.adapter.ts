import axiosClient from "../http/axios-client";
import {
  TutorialRepositoryPort,
  PublicTutorialPage,
  PublicPageContent,
} from "../../domain/ports/tutorial-repository.port";
import { Tutorial } from "../../domain/entities/tutorial.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosTutorialRepositoryAdapter implements TutorialRepositoryPort {
  // ── Admin ──
  async list(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Tutorial>> {
    const { data } = await axiosClient.get<Paginated<Tutorial>>("/courses", {
      params,
    });
    return data;
  }

  async get(id: string): Promise<Tutorial> {
    const { data } = await axiosClient.get<{ data: Tutorial }>(
      `/courses/${id}`
    );
    return data.data;
  }

  async create(body: Partial<Tutorial>): Promise<Tutorial> {
    const { data } = await axiosClient.post<{ data: Tutorial }>(
      "/courses",
      body
    );
    return data.data;
  }

  async update(id: string, body: Partial<Tutorial>): Promise<Tutorial> {
    const { data } = await axiosClient.put<{ data: Tutorial }>(
      `/courses/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/courses/${id}`);
  }

  // ── Público ──
  async listPublic(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Tutorial>> {
    const { data } = await axiosClient.get<Paginated<Tutorial>>(
      "/public/tutorials",
      { params }
    );
    return data;
  }

  async getPublicBySlug(slug: string): Promise<Tutorial> {
    const { data } = await axiosClient.get<Tutorial>(
      `/public/tutorials/${slug}`
    );
    return data;
  }

  async getPublicPages(slug: string): Promise<PublicTutorialPage[]> {
    const { data } = await axiosClient.get<{ pages: PublicTutorialPage[] }>(
      `/public/tutorials/${slug}/pages`
    );
    return data.pages;
  }

  async getPublicPageContent(
    courseSlug: string,
    lessonSlug: string
  ): Promise<PublicPageContent> {
    const { data } = await axiosClient.get<PublicPageContent>(
      `/public/tutorials/${courseSlug}/pages/${lessonSlug}`
    );
    return data;
  }
}
