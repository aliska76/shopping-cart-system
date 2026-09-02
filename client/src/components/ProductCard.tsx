import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useTranslation } from 'react-i18next';
import type { Product } from '../types/types';
import ProductImage from './ProductImage';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { decrementItem, incrementItem, selectCartItemQuantity } from '../features/cart/cartSlice';
import { cardSx, cardContentSx, titleSx, stepperRowSx, quantitySx } from './ProductCard.styles';

export default function ProductCard({
  product,
  categoryName,
  className,
}: {
  product: Product;
  categoryName: string;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const quantity = useAppSelector((state) => selectCartItemQuantity(state.cart, product.id));

  const localizedName = i18n.language === 'he' ? product.nameHe : product.nameEn;

  const handleIncrement = () =>
    dispatch(
      incrementItem({
        productId: product.id,
        productName: localizedName,
        categoryName,
        unitPrice: product.unitPrice,
        unit: product.unit,
      }),
    );
  const handleDecrement = () => dispatch(decrementItem({ productId: product.id }));

  return (
    <Card
      variant="outlined"
      className={className}
      data-testid={`product-card-${product.id}`}
      sx={cardSx}
    >
      <ProductImage product={product} alt={localizedName} />
      <CardContent sx={cardContentSx}>
        <Typography variant="subtitle1" component="h3" sx={titleSx}>
          {localizedName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('catalog.pricePerUnit', {
            price: product.unitPrice.toFixed(2),
            unit: t(`catalog.unit.${product.unit}`),
          })}
        </Typography>
        <Box sx={stepperRowSx}>
          <IconButton
            size="small"
            color="primary"
            disabled={quantity === 0}
            onClick={handleDecrement}
            aria-label={t('catalog.removeFromCart')}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body1"
            sx={quantitySx}
            data-testid={`quantity-${product.id}`}
          >
            {quantity}
          </Typography>
          <IconButton
            size="small"
            color="primary"
            onClick={handleIncrement}
            aria-label={t('catalog.addToCart')}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
