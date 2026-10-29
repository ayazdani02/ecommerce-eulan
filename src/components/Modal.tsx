"use client";
import {
  useEffect,
  useRef,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
import { Icon } from "./Icon";
export function Modal({
  open,
  onClose,
  title,
  className = "drawer",
  returnFocus,
  onKeyDown,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  returnFocus?: HTMLElement | null;
  onKeyDown?: KeyboardEventHandler<HTMLDialogElement>;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const prior = returnFocus ?? (document.activeElement as HTMLElement | null);
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      prior?.focus();
    };
  }, [open, returnFocus]);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={title}
      onKeyDown={onKeyDown}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button
          className="close"
          onClick={onClose}
          aria-label={`Cerrar ${title.toLowerCase()}`}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
