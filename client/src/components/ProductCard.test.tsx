import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import '../i18n/i18n';
import { store } from '../app/store';
import { clearCart } from '../features/cart/cartSlice';
import ProductCard from './ProductCard';
import type { Product } from '../api/types';

const product: Product = {
  id: 101,
  nameEn: 'Apples',
  nameHe: 'תפוחים',
  imageUrl: null,
  imagePath: null,
};

function renderCard() {
  return render(
    <Provider store={store}>
      <ProductCard product={product} categoryName="Fruits & Vegetables" />
    </Provider>,
  );
}

describe('ProductCard', () => {
  afterEach(() => {
    store.dispatch(clearCart());
  });

  it('starts at quantity 0 with the decrement button disabled', () => {
    renderCard();
    expect(screen.getByTestId('quantity-101')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: /remove/i })).toBeDisabled();
  });

  it('clicking + increments the displayed quantity and enables -', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByTestId('quantity-101')).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /remove/i })).toBeEnabled();
  });

  it('clicking + then - returns to quantity 0 and disables - again', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole('button', { name: /add/i }));
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(screen.getByTestId('quantity-101')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: /remove/i })).toBeDisabled();
  });
});
