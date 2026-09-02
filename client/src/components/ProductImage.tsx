import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import type { Product } from '../api/types';

const PLACEHOLDER_SRC = '/images/placeholder.svg';
const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL;

/**
 * Resolution order, matching architecture.md's decision on the two image
 * fields: prefer the same-origin `imagePath` server-catalog actually serves
 * (fast, no external dependency); fall back to the candidate's original
 * external `imageUrl`; fall back to a local placeholder if neither is set,
 * or if whichever URL we picked fails to load (onError).
 */
function resolveInitialSrc(product: Pick<Product, 'imagePath' | 'imageUrl'>): string {
  if (product.imagePath) return `${CATALOG_API_URL}${product.imagePath}`;
  if (product.imageUrl) return product.imageUrl;
  return PLACEHOLDER_SRC;
}

export default function ProductImage({
  product,
  alt,
}: {
  product: Pick<Product, 'imagePath' | 'imageUrl'>;
  alt: string;
}) {
  const initialSrc = useMemo(() => resolveInitialSrc(product), [product]);
  const [src, setSrc] = useState(initialSrc);

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setSrc(PLACEHOLDER_SRC)}
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
