/**
 * L9 serializer — `snapshot()` determinism (stable field order).
 */
import { describe, expect, it } from 'vitest';
import { exampleEntitySerializer } from '../../src/entity/serializer';
import type { ExampleEntitySnapshot } from '../../src/entity/dto';

const ctx = {} as never; // SerializeContext is unused by snapshot()

describe('example-entity serializer', () => {
  it('ac-snapshot-deterministic: the same entity state always serializes to an identical snapshot, regardless of input key order', () => {
    // Two objects with the SAME state but DIFFERENT key insertion order.
    const a: ExampleEntitySnapshot = {
      slug: 'example-entity',
      name: 'Example Entity',
      description: 'd',
      data: { k: 1 },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    const b = {
      updatedAt: '2026-01-02T00:00:00.000Z',
      data: { k: 1 },
      name: 'Example Entity',
      createdAt: '2026-01-01T00:00:00.000Z',
      slug: 'example-entity',
      description: 'd',
    } as ExampleEntitySnapshot;

    const snapA = JSON.stringify(exampleEntitySerializer.snapshot(a, ctx));
    const snapB = JSON.stringify(exampleEntitySerializer.snapshot(b, ctx));

    // Byte-identical output — deterministic and independent of input ordering.
    expect(snapA).toBe(snapB);
    // Repeated on the same input, still identical.
    expect(JSON.stringify(exampleEntitySerializer.snapshot(a, ctx))).toBe(snapA);
    // The stable field order the contract fixes: slug, name, description, data, timestamps.
    expect(Object.keys(exampleEntitySerializer.snapshot(a, ctx) as object)).toEqual([
      'slug',
      'name',
      'description',
      'data',
      'createdAt',
      'updatedAt',
    ]);
  });
});
