import { decodeCursor, encodeCursor } from './cursor.util';

describe('cursor.util', () => {
  it('round-trips sort values through encode/decode unchanged', () => {
    const sortValues: [string, string] = ['2026-09-02T12:00:00.000Z', 'order-42'];
    const cursor = encodeCursor(sortValues);
    const decoded = decodeCursor(cursor);
    expect(decoded).toEqual(sortValues);
  });

  it('produces a URL-safe opaque string, not raw JSON', () => {
    const cursor = encodeCursor(['2026-09-02T12:00:00.000Z', 'order/with slashes']);
    expect(cursor).not.toContain('"');
    expect(cursor).not.toContain('/');
  });

  it('throws on a cursor that is not valid encoded JSON', () => {
    expect(() => decodeCursor('%%%not-base64%%%')).toThrow();
  });

  it('throws on a cursor that decodes to the wrong shape', () => {
    const wrongShape = Buffer.from(JSON.stringify({ not: 'an array' }), 'utf8').toString('base64url');
    expect(() => decodeCursor(wrongShape)).toThrow();
  });
});
