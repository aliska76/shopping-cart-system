/**
 * Opaque cursor for Elasticsearch's own keyset-pagination primitive, search_after -- the ES
 * equivalent of the `Id > cursor` trick server-catalog's EF Core repository uses, just
 * expressed as a composite sort-value tuple (ES has no single auto-increment id to key off)
 * instead of a single integer. The cursor is base64url(JSON([createdAt, _id])) so it stays
 * one opaque string in the API, exactly like server-catalog's numeric cursor.
 *
 * Deliberately framework-free (no Nest imports, throws a plain Error) so it's testable on
 * its own, the same way server-catalog's cursor logic is tested directly against
 * InMemoryCategoryRepository without spinning up the whole app.
 */
export type SortValues = [string, string]; // [createdAt ISO string, _id]

export function encodeCursor(sortValues: SortValues): string {
  return Buffer.from(JSON.stringify(sortValues), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): SortValues {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));

    if (!Array.isArray(decoded) || decoded.length !== 2) {
      throw new Error('malformed cursor');
    }

    return decoded as SortValues;
  } catch {
    throw new Error('Invalid pagination cursor.');
  }
}
