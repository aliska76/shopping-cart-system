import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import type { Product } from '../types/types';

const PLACEHOLDER_SRC = '/images/placeholder.svg';
const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL;

type ImageStage = 'path' | 'url' | 'placeholder';

/**
 * Three real sources, tried in order, each one only after the previous one actually failed
 * to load — not just "whichever is set first":
 *   1. `imagePath` — same-origin, server-catalog's own copy under wwwroot/images/.
 *   2. `imageUrl` — the original external URL, if `imagePath` 404s. This matters in practice:
 *      catalog-demo-data.json sets `imagePath` for every product regardless of whether
 *      scripts/download-product-images.mjs actually managed to download that one (see its
 *      own README/comment — a handful of source URLs don't resolve), so some products' local
 *      file genuinely doesn't exist even though the field is populated. Falling straight to
 *      the placeholder for those, without trying the external URL server-catalog still has
 *      on file, would show a placeholder for a product that has a perfectly good photo
 *      available — caught by inspecting a real page load's Network tab.
 *   3. The local placeholder — only once both real sources have failed, or neither was set.
 */
function firstStage(product: Pick<Product, 'imagePath' | 'imageUrl'>): ImageStage {
  if (product.imagePath) return 'path';
  if (product.imageUrl) return 'url';
  return 'placeholder';
}

function srcForStage(stage: ImageStage, product: Pick<Product, 'imagePath' | 'imageUrl'>): string {
  switch (stage) {
    case 'path':
      return `${CATALOG_API_URL}${product.imagePath}`;
    case 'url':
      return product.imageUrl!;
    case 'placeholder':
      return PLACEHOLDER_SRC;
  }
}

function nextStage(stage: ImageStage, product: Pick<Product, 'imagePath' | 'imageUrl'>): ImageStage {
  if (stage === 'path') return product.imageUrl ? 'url' : 'placeholder';
  return 'placeholder';
}

export default function ProductImage({
  product,
  alt,
  className,
}: {
  product: Pick<Product, 'id' | 'imagePath' | 'imageUrl'>;
  alt: string;
  className?: string;
}) {
  const [stage, setStage] = useState<ImageStage>(() => firstStage(product));

  // A different product (e.g. Redux/RTK Query returning a new object reference for the same
  // list) resets the fallback chain instead of getting stuck on whatever stage the previous
  // product's image happened to fail at.
  useEffect(() => {
    setStage(firstStage(product));
  }, [product]);

  return (
    <Box
      component="img"
      src={srcForStage(stage, product)}
      alt={alt}
      loading="lazy"
      className={className}
      data-testid={`product-image-${product.id}`}
      onError={() => setStage((current) => nextStage(current, product))}
      sx={{
        width: '100%',
        height: 140,
        objectFit: 'contain',
        backgroundColor: 'grey.100',
        borderTopLeftRadius: 'inherit',
        borderTopRightRadius: 'inherit',
      }}
    />
  );
}
