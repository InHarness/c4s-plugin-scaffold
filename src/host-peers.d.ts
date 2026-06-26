/**
 * Ambient stubs for THIRD-PARTY peers the plugin externalizes but does not
 * install real `@types` for (so `npm run typecheck` passes offline). These are
 * NOT host types — the host publishes only `@c4s/plugin-runtime` (+ `/ui`), which
 * come from `@inharness-ai/claude4spec` (see `src/_host-types.d.ts`). If you add
 * real dependencies/`@types` for any of these, delete its block here.
 *
 * Loosely typed on purpose — just enough surface for the scaffold's stub bodies.
 */

declare module '@inharness-ai/agent-adapters' {
  export interface McpServerInstance {
    name: string;
    [key: string]: unknown;
  }
  export function mcpTool(
    name: string,
    description: string,
    schema: Record<string, unknown>,
    handler: (args: Record<string, unknown>) => Promise<unknown> | unknown,
  ): unknown;
  export function createMcpServer(def: {
    name: string;
    tools: unknown[];
  }): McpServerInstance;
}

declare module 'zod' {
  export const z: any;
}

declare module '@tanstack/react-query' {
  export function useQuery(options: {
    queryKey: unknown[];
    queryFn: () => unknown;
    enabled?: boolean;
  }): { data: any; isLoading: boolean; error: unknown };
}

declare module 'express' {
  export interface Request {
    params: Record<string, string>;
    query: Record<string, unknown>;
    body: unknown;
  }
  export interface Response {
    status(code: number): Response;
    json(body: unknown): Response;
  }
  export type NextFunction = (err?: unknown) => void;
  export interface Router {
    get(path: string, ...handlers: unknown[]): Router;
    post(path: string, ...handlers: unknown[]): Router;
    patch(path: string, ...handlers: unknown[]): Router;
    delete(path: string, ...handlers: unknown[]): Router;
    use(...handlers: unknown[]): Router;
  }
  export function Router(): Router;
}
