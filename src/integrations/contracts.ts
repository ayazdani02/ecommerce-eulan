// Puertos futuros. Ningún servicio externo está activado por estas interfaces.
export interface ShippingQuote {
  carrier: string;
  amount: number;
  currency: "CLP";
  estimatedDays?: number;
}
export interface ShippingProvider {
  quote(input: {
    commune: string;
    region: string;
    weightGrams: number;
  }): Promise<ShippingQuote[]>;
}
export interface MarketplaceConnector {
  publishProduct(productId: string): Promise<{ externalId: string }>;
}
export interface PaymentSession {
  id: string;
  redirectUrl: string;
}
export interface PaymentProvider {
  createSession(cartId: string): Promise<PaymentSession>;
}
