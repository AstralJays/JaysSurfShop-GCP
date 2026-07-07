export interface Product {
  id: string;
  name: string;
  category: "surfboards" | "wax" | "wetsuits";
  price: number;
  description: string;
  image: string;
  specs: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BoardDesignOptions {
  board_types: string[];
  patterns: string[];
  color_suggestions: string[];
}
