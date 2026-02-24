// =============================================================================
// Radix Router - Efficient URL pattern matching
// =============================================================================

/**
 * Result of a successful route match.
 * @template T The type of data associated with the route (e.g., handler and pipeline).
 */
export interface RouteMatch<T> {
  /** The data payload stored for the matched route. */
  data: T;
  /** Extracted path parameters. */
  params: Record<string, string>;
}

/**
 * Internal tree node for the Radix router.
 * @template T The type of data stored at the node.
 */
class RouterNode<T> {
  children: Map<string, RouterNode<T>> = new Map();
  paramChild: RouterNode<T> | null = null;
  wildcardChild: RouterNode<T> | null = null;
  paramName: string | null = null;
  handlers: Map<string, T> = new Map();

  /**
   * Inserts a route into the node tree.
   */
  insert(segments: string[], method: string, data: T) {
    let current: RouterNode<T> = this;

    for (const segment of segments) {
      if (segment.startsWith(":")) {
        if (!current.paramChild) {
          current.paramChild = new RouterNode<T>();
          current.paramName = segment.slice(1);
        }
        current = current.paramChild;
      } else if (segment === "*") {
        if (!current.wildcardChild) {
          current.wildcardChild = new RouterNode<T>();
        }
        current = current.wildcardChild;
        break;
      } else {
        if (!current.children.has(segment)) {
          current.children.set(segment, new RouterNode<T>());
        }
        current = current.children.get(segment)!;
      }
    }

    current.handlers.set(method.toUpperCase(), data);
  }

  /**
   * Searches for a matching route in the node tree.
   */
  search(
    segments: string[],
    method: string,
    params: Record<string, string>,
  ): T | null {
    let current: RouterNode<T> = this;

    for (const segment of segments) {
      const next = current.children.get(segment);
      if (next) {
        current = next;
      } else if (current.paramChild) {
        if (current.paramName) {
          params[current.paramName] = segment;
        }
        current = current.paramChild;
      } else if (current.wildcardChild) {
        current = current.wildcardChild;
        return current.handlers.get(method.toUpperCase()) || null;
      } else {
        return null;
      }
    }

    return current.handlers.get(method.toUpperCase()) || null;
  }
}

/**
 * Radix tree based router for efficient URL pattern matching.
 * @template T The type of data associated with each route.
 */
export class RadixRouter<T> {
  private root = new RouterNode<T>();

  /**
   * Adds a new route to the router.
   * @param method HTTP method.
   * @param path URL path pattern.
   * @param data Data payload to store with the route.
   */
  add(method: string, path: string, data: T) {
    const segments = this.splitPath(path);
    this.root.insert(segments, method, data);
  }

  /**
   * Finds a matching route for the given method and path.
   * @param method HTTP method.
   * @param path URL path to match.
   * @returns RouteMatch containing the data and extracted parameters, or null if not found.
   */
  find(method: string, path: string): RouteMatch<T> | null {
    const segments = this.splitPath(path);
    const params: Record<string, string> = {};
    const data = this.root.search(segments, method, params);

    if (data === null) {
      return null;
    }

    return { data, params };
  }

  /** Helper to split a path into normalized segments. */
  private splitPath(path: string): string[] {
    return path.split("/").filter((s) => s.length > 0);
  }
}
