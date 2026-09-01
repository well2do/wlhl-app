"use client";

import type { MouseEvent } from "react";
import { Trash2 } from "lucide-react";

export function DeleteProductButton({ productName }: { productName: string }) {
  function confirmDelete(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) {
      event.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      className="product-delete-button"
      aria-label={`Delete ${productName}`}
      onClick={confirmDelete}
    >
      <Trash2 size={12} />
      Delete
    </button>
  );
}
