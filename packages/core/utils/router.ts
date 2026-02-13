export interface RouteMatch<T> {
	data: T;
	params: Record<string, string>;
}

class Node<T> {
	children: Map<string, Node<T>> = new Map();
	paramChild: Node<T> | null = null;
	wildcardChild: Node<T> | null = null;
	paramName: string | null = null;
	handlers: Map<string, T> = new Map();

	insert(segments: string[], method: string, data: T) {
		let current: Node<T> = this;

		for (const segment of segments) {
			if (segment.startsWith(":")) {
				if (!current.paramChild) {
					current.paramChild = new Node<T>();
					current.paramName = segment.slice(1);
				}
				current = current.paramChild;
			} else if (segment === "*") {
				if (!current.wildcardChild) {
					current.wildcardChild = new Node<T>();
				}
				current = current.wildcardChild;
				break; // Wildcard is always the end
			} else {
				if (!current.children.has(segment)) {
					current.children.set(segment, new Node<T>());
				}
				current = current.children.get(segment)!;
			}
		}

		current.handlers.set(method.toUpperCase(), data);
	}

	search(segments: string[], method: string, params: Record<string, string>): T | null {
		let current: Node<T> = this;

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

export class RadixRouter<T> {
	private root = new Node<T>();

	add(method: string, path: string, data: T) {
		const segments = this.splitPath(path);
		this.root.insert(segments, method, data);
	}

	find(method: string, path: string): RouteMatch<T> | null {
		const segments = this.splitPath(path);
		const params: Record<string, string> = {};
		const data = this.root.search(segments, method, params);

		if (data === null) {
			return null;
		}

		return { data, params };
	}

	private splitPath(path: string): string[] {
		return path.split("/").filter((s) => s.length > 0);
	}
}
