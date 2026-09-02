import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import '../i18n/i18n';
import { store } from '../app/store';
import { clearCart, setItemQuantity } from '../features/cart/cartSlice';
import CheckoutPage from './CheckoutPage';

function renderCheckout() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/checkout']}>
        <CheckoutPage />
      </MemoryRouter>
    </Provider>,
  );
}

const apple = {
  productId: 15,
  productName: 'Apples',
  categoryName: 'Fruits & Vegetables',
  unitPrice: 6.9,
  unit: 'Kilogram' as const,
};

const eggs = {
  productId: 22,
  productName: 'Eggs',
  categoryName: 'Dairy & Eggs',
  unitPrice: 12,
  unit: 'Piece' as const,
};

describe('CheckoutPage order summary', () => {
  afterEach(() => {
    store.dispatch(clearCart());
  });

  it('shows the empty-cart state when there is nothing to check out', () => {
    renderCheckout();
    expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
    expect(screen.queryByTestId('order-summary-total')).not.toBeInTheDocument();
  });

  it('shows unit price and a per-line total for each cart line', () => {
    store.dispatch(setItemQuantity({ ...apple, quantity: 3 }));
    renderCheckout();

    const line = screen.getByTestId('order-summary-item-15');
    // 6.90 / kg, and 3 × 6.90 = 20.70 as the line total.
    expect(line).toHaveTextContent('6.90');
    expect(line).toHaveTextContent('kg');
    expect(line).toHaveTextContent('20.70');
  });

  it('sums every line into a grand total', () => {
    store.dispatch(setItemQuantity({ ...apple, quantity: 2 })); // 2 * 6.90 = 13.80
    store.dispatch(setItemQuantity({ ...eggs, quantity: 1 })); // 1 * 12.00 = 12.00
    renderCheckout();

    // 13.80 + 12.00 = 25.80
    expect(screen.getByTestId('order-summary-total')).toHaveTextContent('25.80');
  });

  it('recomputes the grand total as quantities change', () => {
    store.dispatch(setItemQuantity({ ...apple, quantity: 1 }));
    const { rerender } = renderCheckout();
    expect(screen.getByTestId('order-summary-total')).toHaveTextContent('6.90');

    store.dispatch(setItemQuantity({ ...apple, quantity: 4 }));
    rerender(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/checkout']}>
          <CheckoutPage />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByTestId('order-summary-total')).toHaveTextContent('27.60');
  });
});
