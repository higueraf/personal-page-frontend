import { DomainException } from "./domain.exception";

/** Error de dominio que envuelve una falla de comunicación con la API (HTTP). */
export class ApiException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = "ApiException";
  }
}
