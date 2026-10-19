/** Explicitly safe, user-facing business-rule failure (never wrap DB errors). */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
