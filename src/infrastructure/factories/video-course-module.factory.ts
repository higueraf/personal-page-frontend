import { AxiosVideoCourseRepositoryAdapter } from "../adapters/video-course-repository.adapter";
import { VideoCourseUseCases } from "../../application/use-cases/video-course/video-course.use-cases";

export const videoCourseUseCases = new VideoCourseUseCases(
  new AxiosVideoCourseRepositoryAdapter()
);
