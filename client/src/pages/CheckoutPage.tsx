import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { clearCart, selectCartItems } from '../features/cart/cartSlice';
import { useCreateOrderMutation } from '../api/ordersApi';
import type { CreateOrderResponse } from '../api/types';
import {
  validateCheckoutForm,
  type CheckoutFormValues as FormValues,
  type CheckoutFormErrors as FormErrors,
} from './checkoutValidation';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => selectCartItems(state.cart));
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const [values, setValues] = useState<FormValues>({ fullName: '', email: '', address: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState(false);
  const [confirmed, setConfirmed] = useState<CreateOrderResponse | null>(null);

  const handleChange =
    (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateCheckoutForm(values, {
      fullNameRequired: t('checkout.fullNameRequired'),
      emailRequired: t('checkout.emailRequired'),
      emailInvalid: t('checkout.emailInvalid'),
      addressRequired: t('checkout.addressRequired'),
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitError(false);
    try {
      const response = await createOrder({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          categoryName: item.categoryName,
          quantity: item.quantity,
        })),
      }).unwrap();
      setConfirmed(response);
      dispatch(clearCart());
    } catch {
      setSubmitError(true);
    }
  };

  if (confirmed) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('checkout.orderConfirmedTitle')}
        </Alert>
        <Typography sx={{ mb: 3 }}>
          {t('checkout.orderConfirmedBody', { fullName: values.fullName, orderId: confirmed.id })}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('checkout.startNewOrder')}
        </Button>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
          {t('checkout.cartEmptyTitle')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('checkout.cartEmptyBody')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('common.backToCatalog')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t('checkout.title')}
      </Typography>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <List dense>
          <ListItem>
            <Typography sx={{ fontWeight: 'bold' }}>{t('checkout.yourItems')}</Typography>
          </ListItem>
          <Divider component="li" />
          {cartItems.map((item) => (
            <ListItem key={item.productId}>
              <ListItemText primary={item.productName} secondary={item.categoryName} />
              <Typography>
                {t('checkout.quantity')}: {item.quantity}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Paper>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('checkout.orderFailed')}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label={t('checkout.fullNameLabel')}
          value={values.fullName}
          onChange={handleChange('fullName')}
          error={!!errors.fullName}
          helperText={errors.fullName}
          required
          fullWidth
        />
        <TextField
          label={t('checkout.emailLabel')}
          type="email"
          value={values.email}
          onChange={handleChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          required
          fullWidth
        />
        <TextField
          label={t('checkout.addressLabel')}
          value={values.address}
          onChange={handleChange('address')}
          error={!!errors.address}
          helperText={errors.address}
          required
          fullWidth
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Button onClick={() => navigate('/')}>{t('common.backToCatalog')}</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? t('checkout.submitting') : t('checkout.confirmOrder')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
