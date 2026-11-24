import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  toast: { id: number; message: string } | null;
}

/** Single-slot status message. Announced politely to screen readers. */
export const Toast: React.FC<ToastProps> = ({ toast }) => (
  <div
    role="status"
    aria-live="polite"
    className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
  >
    {toast && (
      <div
        key={toast.id}
        className="animate-toast-in flex max-w-md items-center gap-2.5 rounded-lg bg-ink py-2.5 pl-3 pr-4 text-sm text-ground shadow-[0_10px_30px_-10px_rgba(22,22,20,0.55)]"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-signal text-ink">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        {toast.message}
      </div>
    )}
  </div>
);
