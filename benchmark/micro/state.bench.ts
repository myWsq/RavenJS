import { bench, group, run } from "mitata";
import {
  AppState,
  RequestState,
  currentAppStorage,
  requestStorage,
  type RavenInstance,
} from "../../packages/core/main";

function createAppInstance(parent: RavenInstance | null = null): RavenInstance {
  return {
    parent,
    internalStateMap: new Map(),
  };
}

const appState = new AppState<string>({ name: "bench:app" });
const requestState = new RequestState<string>({ name: "bench:request" });

function setupAppContext(depth: number): RavenInstance {
  let root = createAppInstance(null);
  let current = root;
  
  for (let i = 0; i < depth; i++) {
    const child = createAppInstance(current);
    current = child;
  }
  
  root.internalStateMap.set(appState.symbol, "root-value");
  
  return current;
}

group("AppState Operations", () => {
  bench("get - direct", () => {
    const app = createAppInstance(null);
    app.internalStateMap.set(appState.symbol, "test-value");
    
    currentAppStorage.run(app, () => {
      appState.get();
    });
  });

  bench("set", () => {
    const app = createAppInstance(null);
    
    currentAppStorage.run(app, () => {
      appState.set("test-value");
    });
  });

  bench("get + set cycle", () => {
    const app = createAppInstance(null);
    
    currentAppStorage.run(app, () => {
      appState.set("test-value");
      appState.get();
    });
  });
});

group("RequestState Operations", () => {
  bench("get - direct", () => {
    const store = new Map<symbol, any>();
    store.set(requestState.symbol, "test-value");
    
    requestStorage.run(store, () => {
      requestState.get();
    });
  });

  bench("set", () => {
    const store = new Map<symbol, any>();
    
    requestStorage.run(store, () => {
      requestState.set("test-value");
    });
  });

  bench("get + set cycle", () => {
    const store = new Map<symbol, any>();
    
    requestStorage.run(store, () => {
      requestState.set("test-value");
      requestState.get();
    });
  });
});

group("AppState Inheritance Chain Lookup", () => {
  bench("depth 1 (no inheritance)", () => {
    const app = setupAppContext(0);
    
    currentAppStorage.run(app, () => {
      appState.get();
    });
  });

  bench("depth 3", () => {
    const app = setupAppContext(2);
    
    currentAppStorage.run(app, () => {
      appState.get();
    });
  });

  bench("depth 5", () => {
    const app = setupAppContext(4);
    
    currentAppStorage.run(app, () => {
      appState.get();
    });
  });

  bench("depth 10", () => {
    const app = setupAppContext(9);
    
    currentAppStorage.run(app, () => {
      appState.get();
    });
  });
});

group("AsyncLocalStorage Overhead", () => {
  bench("getStore (app)", () => {
    const app = createAppInstance(null);
    
    currentAppStorage.run(app, () => {
      currentAppStorage.getStore();
    });
  });

  bench("getStore (request)", () => {
    const store = new Map<symbol, any>();
    
    requestStorage.run(store, () => {
      requestStorage.getStore();
    });
  });

  bench("run context switch", () => {
    const app = createAppInstance(null);
    currentAppStorage.run(app, () => {});
  });

  bench("nested run (app + request)", () => {
    const app = createAppInstance(null);
    const store = new Map<symbol, any>();
    
    currentAppStorage.run(app, () => {
      requestStorage.run(store, () => {});
    });
  });
});

group("Multiple State Access Pattern", () => {
  const state1 = new AppState<string>({ name: "bench:state1" });
  const state2 = new AppState<string>({ name: "bench:state2" });
  const state3 = new AppState<string>({ name: "bench:state3" });

  bench("access 3 states sequentially", () => {
    const app = createAppInstance(null);
    app.internalStateMap.set(state1.symbol, "v1");
    app.internalStateMap.set(state2.symbol, "v2");
    app.internalStateMap.set(state3.symbol, "v3");
    
    currentAppStorage.run(app, () => {
      state1.get();
      state2.get();
      state3.get();
    });
  });
});

await run({
  colors: true,
});
