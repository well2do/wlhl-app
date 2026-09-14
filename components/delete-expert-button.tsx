"use client";

import type { MouseEvent } from "react";
import { Trash2 } from "lucide-react";

export function DeleteExpertButton({ expertName }: { expertName: string }) {
  function confirmDelete(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(`Delete expert profile "${expertName}"? This cannot be undone.`)) {
      event.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      className="button button-danger button-full"
      aria-label={`Delete expert profile ${expertName}`}
      onClick={confirmDelete}
    >
      <Trash2 size={16} />
      Delete expert
    </button>
  );
}
