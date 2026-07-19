import axiosClient from "../http/axios-client";
import { TutorialSectionRepositoryPort } from "../../domain/ports/tutorial-section-repository.port";
import { TutorialSection } from "../../domain/entities/tutorial-section.entity";
import { Paginated } from "../../domain/shared/pagination";

/**
 * El endpoint legacy `/course-sections` usa el campo `course` para referirse
 * al Tutorial padre. Este adapter traduce entre esa forma de la API y el
 * nombre de dominio `tutorial` usado en TutorialSection.
 */
interface ApiTutorialSection {
  id: string;
  course: string;
  title: string;
  order: number;
  status?: string;
}

function toDomain(raw: ApiTutorialSection): TutorialSection {
  return {
    id: raw.id,
    tutorial: raw.course,
    title: raw.title,
    order: raw.order,
    status: raw.status,
  };
}

function toApiBody(body: Partial<TutorialSection>): Record<string, any> {
  const { tutorial, ...rest } = body;
  return tutorial !== undefined ? { ...rest, course: tutorial } : rest;
}

export class AxiosTutorialSectionRepositoryAdapter
  implements TutorialSectionRepositoryPort
{
  async list(tutorialId: string): Promise<TutorialSection[]> {
    const { data } = await axiosClient.get<Paginated<ApiTutorialSection>>(
      "/course-sections",
      { params: { course_id: tutorialId } }
    );
    return data.data.map(toDomain);
  }

  async create(body: Partial<TutorialSection>): Promise<TutorialSection> {
    const { data } = await axiosClient.post<{ data: ApiTutorialSection }>(
      "/course-sections",
      toApiBody(body)
    );
    return toDomain(data.data);
  }

  async update(
    id: string,
    body: Partial<TutorialSection>
  ): Promise<TutorialSection> {
    const { data } = await axiosClient.put<{ data: ApiTutorialSection }>(
      `/course-sections/${id}`,
      toApiBody(body)
    );
    return toDomain(data.data);
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/course-sections/${id}`);
  }
}
