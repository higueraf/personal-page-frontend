import { AxiosContactRepositoryAdapter } from "../adapters/contact-repository.adapter";
import { ContactUseCases } from "../../application/use-cases/contact/contact.use-cases";

export const contactUseCases = new ContactUseCases(
  new AxiosContactRepositoryAdapter()
);
