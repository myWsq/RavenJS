/**
 * Unified Testing API for RavenJS
 * Compatible with Bun (bun:test) and Node.js (vitest)
 */

import type * as BunTest from "bun:test";
import type * as Vitest from "vitest";

// @ts-ignore
const isBun = typeof Bun !== "undefined";

// Use top-level await for dynamic imports based on runtime
const testInterface: any = isBun 
  ? await import("bun:test") 
  : await import("vitest");

export const describe: typeof Vitest.describe = testInterface.describe;
export const it: typeof Vitest.it = testInterface.it;
export const test: typeof Vitest.test = testInterface.test;
export const expect: typeof Vitest.expect = testInterface.expect;
export const beforeEach: typeof Vitest.beforeEach = testInterface.beforeEach;
export const afterEach: typeof Vitest.afterEach = testInterface.afterEach;
export const beforeAll: typeof Vitest.beforeAll = testInterface.beforeAll;
export const afterAll: typeof Vitest.afterAll = testInterface.afterAll;

/**
 * A compatibility layer for mocking.
 * In Vitest, this is the 'vi' object.
 * In Bun, we map common 'vi' methods to Bun's 'mock'.
 */
export const vi: typeof Vitest.vi = isBun
  ? ({
      ...testInterface,
      fn: (implementation?: (...args: any[]) => any) => {
        return testInterface.mock(implementation);
      },
      spyOn: (object: any, method: string) => {
        return testInterface.spyOn(object, method);
      },
    } as any)
  : (testInterface as any).vi;
