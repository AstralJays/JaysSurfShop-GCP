export interface DemoOrder {
  orderId: string;
  customerName: string;
  email: string;
  boardSku: string;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress: string;
}

/** Workshop demo orders — same rows as DynamoDB / chat-rag orders.py */
export const DEMO_ORDERS: Record<string, DemoOrder> = {
  "JSS-10482": {
    orderId: "JSS-10482",
    customerName: "Alex Morgan",
    email: "alex.morgan@example.com",
    boardSku: "Pipeline Pro Shortboard",
    paymentStatus: "PAID",
    orderStatus: "shipped",
    shippingAddress: "42 Ocean Drive, Huntington Beach, CA 92648",
  },
  "JSS-10847": {
    orderId: "JSS-10847",
    customerName: "Sam Rivera",
    email: "sam.rivera@example.com",
    boardSku: "Classic Longboard",
    paymentStatus: "PAID",
    orderStatus: "processing",
    shippingAddress: "88 Pacific Coast Hwy, Laguna Beach, CA 92651",
  },
  "JSS-10903": {
    orderId: "JSS-10903",
    customerName: "Jordan Lee",
    email: "jordan.lee@example.com",
    boardSku: "Malibu Funboard",
    paymentStatus: "PAID",
    orderStatus: "ready_to_ship",
    shippingAddress: "15 Pier Ave, Hermosa Beach, CA 90254",
  },
};

export function normalizeOrderId(raw: string): string {
  return raw.trim().toUpperCase();
}

export function lookupDemoOrder(raw: string): DemoOrder | null {
  return DEMO_ORDERS[normalizeOrderId(raw)] ?? null;
}

export const ORDER_CHAT_STARTERS = [
  "Any paid longboards still waiting to ship?",
  "Ship that order to my address on file",
  "Where is my order?",
];

export function shippingChangeDraft(orderId: string): string {
  const id = normalizeOrderId(orderId);
  return `Hi Maya — please update the shipping address on order ${id}.`;
}
