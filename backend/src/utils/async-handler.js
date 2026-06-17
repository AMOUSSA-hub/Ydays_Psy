/** Encapsule un handler async pour propager les erreurs vers le middleware d'erreur. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Erreur HTTP avec code de statut. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
