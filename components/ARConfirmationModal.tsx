"use client";

import React, { useEffect, useRef } from "react";

interface ARConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ARConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: ARConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle focus lock and escape key
  useEffect(() => {
    if (isOpen) {
      // Save previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Lock scroll
      document.body.style.overflow = "hidden";

      // Set focus to the confirm button after transition
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }

        if (e.key === "Tab") {
          const focusableElements = [confirmButtonRef.current, cancelButtonRef.current];
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === first) {
              last?.focus();
              e.preventDefault();
            }
          } else {
            // Tab
            if (document.activeElement === last) {
              first?.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
        // Restore scroll
        document.body.style.overflow = "";
        // Restore focus
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity duration-300"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ar-dialog-title"
      aria-describedby="ar-dialog-desc"
    >
      <div
        ref={modalRef}
        className="w-full max-w-[340px] overflow-hidden rounded-[28px] bg-zinc-900/90 p-6 text-center text-white shadow-2xl backdrop-blur-2xl border border-white/10"
      >
        <h2
          id="ar-dialog-title"
          className="text-[19px] font-semibold tracking-tight text-white mb-2"
        >
          AG’de Görüntülensin mi?
        </h2>
        <p
          id="ar-dialog-desc"
          className="text-[13px] leading-snug text-zinc-300 px-2 mb-6"
        >
          Bu halıyı 3B olarak görüntüleyebilir ve artırılmış gerçeklik kullanarak odanızın zeminine yerleştirebilirsiniz.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="w-full py-3.5 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-700/80 text-white rounded-2xl transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            AR’da Görüntüle
          </button>
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            className="w-full py-3.5 text-sm font-medium bg-transparent hover:bg-white/5 active:bg-white/10 text-zinc-400 hover:text-white rounded-2xl transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
