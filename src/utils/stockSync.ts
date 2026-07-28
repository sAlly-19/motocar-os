import type { OrderItem, Part } from '../db/schema';

/**
 * Sums part quantities from an OrderItem list. Only items of type 'part'
 * with a linked `partId` participate. Returns a map { partId → quantity }.
 */
export function sumPartQuantities(items: OrderItem[] | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!items) return out;
  for (const item of items) {
    if (item.type !== 'part' || !item.partId) continue;
    out[item.partId] = (out[item.partId] ?? 0) + item.quantity;
  }
  return out;
}

/**
 * Computes the per-part delta (positive to increment, negative to decrement)
 * required to move from `prevItems` to `nextItems`. The returned map only
 * includes parts whose net delta is non-zero.
 */
export function diffStockDeltas(
  prevItems: OrderItem[] | undefined,
  nextItems: OrderItem[] | undefined,
): Record<string, number> {
  const prev = sumPartQuantities(prevItems);
  const next = sumPartQuantities(nextItems);
  const ids = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const out: Record<string, number> = {};
  ids.forEach((id) => {
    const delta = (prev[id] ?? 0) - (next[id] ?? 0); // positive = returned to stock
    if (delta !== 0) out[id] = delta;
  });
  return out;
}

/**
 * Applies a set of stock deltas to the parts array. Positive delta increases
 * `currentStock`, negative delta decreases it (never goes below 0). Returns
 * the list of `updatePartStock(partId, newQty)` invocations the caller must
 * perform against the store/firebase.
 */
export function computeStockUpdates(
  parts: Part[],
  deltas: Record<string, number>,
): { partId: string; newStock: number }[] {
  const updates: { partId: string; newStock: number }[] = [];
  for (const [partId, delta] of Object.entries(deltas)) {
    const part = parts.find((p) => p.id === partId);
    if (!part) continue;
    const newStock = Math.max(0, part.currentStock + delta);
    if (newStock !== part.currentStock) {
      updates.push({ partId, newStock });
    }
  }
  return updates;
}

/**
 * Convenience: compute the stock updates required to CONSUME `items` from
 * `parts` (decrementing stock). Use when an OS is created.
 */
export function consumeStock(
  parts: Part[],
  items: OrderItem[] | undefined,
): { partId: string; newStock: number }[] {
  const qty = sumPartQuantities(items);
  const negDeltas: Record<string, number> = {};
  for (const [id, q] of Object.entries(qty)) negDeltas[id] = -q;
  return computeStockUpdates(parts, negDeltas);
}

/**
 * Convenience: compute the stock updates required to RESTORE `items` to
 * `parts` (incrementing stock). Use when an OS is cancelled.
 */
export function restoreStock(
  parts: Part[],
  items: OrderItem[] | undefined,
): { partId: string; newStock: number }[] {
  const qty = sumPartQuantities(items);
  return computeStockUpdates(parts, qty);
}
