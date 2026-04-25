import { dinero, add, subtract, multiply, toDecimal, toSnapshot, type Dinero, type DineroCurrency } from 'dinero.js';
import { USD, EUR, VES, MXN, COP, ARS } from 'dinero.js';

export const CURRENCIES: Record<string, DineroCurrency<number>> = { USD, EUR, VES, MXN, COP, ARS };

export function money(amount: number | string, currencyCode: string): Dinero<number> {
  const currency = CURRENCIES[currencyCode];
  if (!currency) throw new Error(`Moneda no soportada: ${currencyCode}`);
  const scale = currency.exponent;
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  const value = Math.round(numeric * 10 ** scale);
  return dinero({ amount: value, currency });
}

export function formatMoney(d: Dinero<number>): string {
  const { amount, currency } = toSnapshot(d);
  const decimal = (amount / 10 ** currency.exponent).toFixed(currency.exponent);
  return `${currency.code} ${decimal}`;
}

export { add, subtract, multiply, toDecimal };
