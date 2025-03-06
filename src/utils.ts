export class FetchError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FetchError'
  }
}
