/**
 * Entity backend-slot AC — how the `example-entity` contribution wires its declarative
 * backend (`service` / `crud` / `routes`), why it declares NO per-type `mcpServer`,
 * and the mount escape hatch it deliberately doesn't use.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exampleEntityEntity } from '../../src/entity';
import { ExampleEntityService } from '../../src/entity/backend/services';
import { createTestMountContext } from '../helpers/mount-context';

/** Strip block + line comments so file prose can't be mistaken for live code. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
const readSrc = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

const CRUD_METHODS = ['create', 'get', 'getBySlug', 'update', 'delete', 'list'] as const;

describe('entity backend slots', () => {
  it('ac-host-instancjonuje-serwis-backendu-serv: service is a per-context factory; the one instance it builds is the same one the routes factory unwraps', () => {
    const backend = exampleEntityEntity.backend!;
    expect(typeof backend.service).toBe('function'); // (ctx) => adapter — one call per ProjectContext

    const h = createTestMountContext({ migrate: true });
    try {
      const adapter = backend.service!(h.ctx) as { rich: ExampleEntityService };
      // The generic entity-tools contract shape (host calls these).
      for (const m of CRUD_METHODS) expect(typeof (adapter as Record<string, unknown>)[m]).toBe('function');
      // The routes factory receives that SAME adapter and unwraps `.rich` — proving a
      // single shared instance backs both DI/entity-tools and the HTTP router.
      expect(adapter.rich).toBeInstanceOf(ExampleEntityService);
      const router = backend.routes!.router(adapter as never, h.ctx);
      expect(typeof router).toBe('function'); // an express Router is a callable
    } finally {
      h.close();
    }
  });

  it('ac-pod-slot-crud-wymaga-obecnosci-service: the crud sub-slot is declared alongside a service factory — without a service the host has nothing to call', () => {
    const backend = exampleEntityEntity.backend!;
    expect(backend.crud?.createSchema).toBeDefined();
    expect(backend.crud?.updateSchema).toBeDefined();
    // crud can only work because a service factory is present to back it.
    expect(typeof backend.service).toBe('function');
  });

  it('ac-pod-slot-mount-jest-zdegradowany-do-esca: the type uses the declarative sub-slots, never the `mount` escape hatch', () => {
    const backend = exampleEntityEntity.backend!;
    expect('mount' in backend).toBe(false);
    // Mounting is declarative: migrations + service + crud + routes.
    expect(backend.migrations).toBeDefined();
    expect(backend.service).toBeDefined();
    expect(backend.crud).toBeDefined();
    expect(backend.routes).toBeDefined();
  });

  it('ac-crud-encji-obsluguje-wylacznie-generyczn: CRUD is served by the host generic entity-tools via the declarative `crud` slot — no per-type MCP CRUD server', () => {
    const backend = exampleEntityEntity.backend!;
    // A declarative crud contribution (feeds the host's entity-tools)…
    expect(backend.crud).toBeDefined();
    // …and NO per-type mcpServer: plain CRUD never gets its own server.
    expect(backend.mcpServer).toBeUndefined();
  });

  it('ac-mcp-factory: the mcpServer slot is declarative (absent here — CRUD only) and the backend never registers a server imperatively', () => {
    const backend = exampleEntityEntity.backend!;
    // No custom non-CRUD tool → no mcpServer factory declared.
    expect(backend.mcpServer).toBeUndefined();
    // And the slot is declarative: the backend source never calls the imperative
    // `ctx.registerMcpServer(...)` — the host owns registration of the factory.
    const entitySrc = stripComments(readSrc('src/entity/index.ts'));
    expect(entitySrc).not.toMatch(/registerMcpServer\s*\(/);
  });

  it('ac-mcp-custom-tools-import: the custom-mcpServer example imports helpers from @c4s/plugin-runtime, never the vendor @inharness-ai/agent-adapters', () => {
    const mcpSrc = readSrc('src/entity/backend/mcp.ts');
    // The guidance points at the C4S facade…
    expect(mcpSrc).toMatch(/@c4s\/plugin-runtime/);
    // …and there is no live import from the vendor package (only named in prose as
    // the thing NOT to import).
    expect(stripComments(mcpSrc)).not.toMatch(/from ['"]@inharness-ai\/agent-adapters['"]/);
  });
});
