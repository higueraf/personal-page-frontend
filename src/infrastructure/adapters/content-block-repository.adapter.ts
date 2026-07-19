import axiosClient from "../http/axios-client";
import { ContentBlockRepositoryPort } from "../../domain/ports/content-block-repository.port";
import { ContentBlock } from "../../domain/entities/content-block.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosContentBlockRepositoryAdapter
  implements ContentBlockRepositoryPort
{
  async list(pageId: string): Promise<ContentBlock[]> {
    const { data } = await axiosClient.get<Paginated<ContentBlock>>(
      "/content-blocks",
      { params: { page_id: pageId } }
    );
    return data.data;
  }

  async create(body: Partial<ContentBlock>): Promise<ContentBlock> {
    const { data } = await axiosClient.post<{ data: ContentBlock }>(
      "/content-blocks",
      body
    );
    return data.data;
  }

  async update(id: string, body: Partial<ContentBlock>): Promise<ContentBlock> {
    const { data } = await axiosClient.put<{ data: ContentBlock }>(
      `/content-blocks/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/content-blocks/${id}`);
  }
}
