export class Context {
  public readonly url: URL;

  constructor(
    public readonly request: Request,
    public params: Record<string, string> = {},
    public query: Record<string, string> = {},
  ) {
    this.url = new URL(request.url);
  }

  get method(): Request["method"] {
    return this.request.method;
  }

  get headers(): Request["headers"] {
    return this.request.headers;
  }

  get body(): Request["body"] {
    return this.request.body;
  }
}
