namespace Catalog.Domain.Entities;

/// <summary>
/// How a product's quantity/price are measured — drives both the client's unit label
/// (kg / יח' / ליטר, see client/src/i18n) and, indirectly, what "quantity" means for that
/// product on the cart/order (a count of pieces, or a weight/volume). Three members only,
/// matching what's actually in the demo catalog today (see catalog-demo-data.json) — not
/// modeled as a free-text string, so an invalid unit can't be seeded or posted in the first
/// place; add a member here (and its label in both locale files) if a product genuinely
/// needs a unit outside these three.
/// </summary>
public enum ProductUnit
{
    Kilogram,
    Piece,
    Liter,
}
