import type { Product } from "@/types";

/** Suggested className per category for product images */
export function productImageClass(category: Product["category"]): string {
  switch (category) {
    case "surfboards":
      return "h-[130px] w-auto drop-shadow-lg";
    case "wax":
      return "h-[110px] w-auto drop-shadow-md";
    case "wetsuits":
      return "h-[150px] w-auto drop-shadow-lg";
    default:
      return "h-28 w-auto";
  }
}

export function productDetailImageClass(category: Product["category"]): string {
  switch (category) {
    case "surfboards":
      return "h-[min(360px,70%)] w-auto scale-125 sm:scale-150 drop-shadow-2xl";
    case "wax":
      return "h-[min(280px,60%)] w-auto scale-110 sm:scale-125 drop-shadow-2xl";
    case "wetsuits":
      return "h-[min(340px,70%)] w-auto scale-110 sm:scale-125 drop-shadow-2xl";
    default:
      return "max-h-[70%] w-auto drop-shadow-2xl";
  }
}
