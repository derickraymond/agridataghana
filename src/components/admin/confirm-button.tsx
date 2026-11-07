"use client";

export function ConfirmButton({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="inline-flex items-center justify-center rounded-lg border border-red-600 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
    >
      {children}
    </button>
  );
}
