export interface Paginated<T> {
  data: T[];
  meta: { total_records: number; page: number; page_size: number };
}
