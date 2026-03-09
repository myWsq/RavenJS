export class Context {
  public readonly url: URL;

  constructor(
    public readonly request: Request,
    public params: Record<string, string> = {},
    public query: Record<string, string> = {},
  ) {
    this.url = new URL(request.url);
  }

  get method(): string {
    return this.request.method;
  }

  get headers(): Headers {
    return this.request.headers;
  }

  get body(): ReadableStream<Uint8Array> | null {
    return this.request.body;
  }
}
