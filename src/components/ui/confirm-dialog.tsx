"use client";

import { useEffect, useId, useRef } from "react";
import { gsap } from "gsap";

/**
 * Accessible confirmation dialog (incident.io confirm geometry):
 * centered card, explicit Cancel + Confirm, Escape to close,
 * focus moved in and restored on close.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.showModal();
    cancelRef.current?.focus();
    const tween = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? gsap.fromTo(dialog, { opacity: 0, y: 12, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .26, ease: "power3.out", clearProps: "all" })
      : null;
    return () => {
      tween?.kill();
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    // Disabling the focused Confirm button otherwise drops focus to body,
    // where the dialog's key handler cannot contain the next Tab.
    if (open && busy) dialogRef.current?.focus();
  }, [open, busy]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={body ? bodyId : undefined}
      aria-busy={busy}
      tabIndex={-1}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-surface p-6 text-foreground shadow-modal backdrop:bg-black/40"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        // Native modal dialogs can still Tab into browser chrome in Chromium.
        // Keep both directions inside, including while every button is disabled.
        e.preventDefault();
        const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        if (buttons.length === 0) {
          e.currentTarget.focus();
          return;
        }
        const current = buttons.findIndex((button) => button === document.activeElement);
        const next = current < 0 ? (e.shiftKey ? buttons.length - 1 : 0) :
          (current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        buttons[next].focus();
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        if (!busy && e.target === e.currentTarget &&
          (e.clientX < bounds.left || e.clientX > bounds.right ||
            e.clientY < bounds.top || e.clientY > bounds.bottom)) onClose();
      }}
    >
      <div className="[overflow-wrap:anywhere]">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {body && <p id={bodyId} className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className="btn btn-outline btn-sm">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={tone === "danger" ? "btn btn-danger btn-sm" : "btn btn-primary btn-sm"}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
