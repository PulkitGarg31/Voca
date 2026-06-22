"use client";
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const ToastContext = createContext({ toast: { success() {}, error() {}, info() {} } });
const ConfirmContext = createContext({ confirm: async () => false });

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const [dialog, setDialog] = useState(null); // { opts, resolve }

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const toast = useRef({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  }).current;

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ opts: opts || {}, resolve })),
    []
  );

  function closeDialog(result) {
    dialog?.resolve(result);
    setDialog(null);
  }

  // Close the confirm dialog on Escape.
  useEffect(() => {
    if (!dialog) return;
    function onKey(e) {
      if (e.key === "Escape") {
        dialog.resolve(false);
        setDialog(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  const toneCls = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    error: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    info: "border-line bg-surface text-ink",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ConfirmContext.Provider value={{ confirm }}>
        {children}

        {/* Toasts */}
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(92vw,22rem)]">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-2 text-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${toneCls[t.type]}`}
            >
              <span className="flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Confirm dialog */}
        {dialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4" onClick={() => closeDialog(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className="bg-surface border border-line rounded-2xl w-full max-w-sm shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="confirm-title" className="font-display text-lg font-semibold text-ink">{dialog.opts.title || "Are you sure?"}</h3>
              {dialog.opts.message && <p className="text-sm text-muted mt-2">{dialog.opts.message}</p>}
              <div className="flex gap-2 mt-6 justify-end">
                <button autoFocus onClick={() => closeDialog(false)} className="btn-ghost py-2 px-4 text-xs">
                  {dialog.opts.cancelLabel || "Cancel"}
                </button>
                <button
                  onClick={() => closeDialog(true)}
                  className={`py-2 px-4 text-xs font-semibold rounded-full transition-colors ${
                    dialog.opts.danger
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-accent hover:bg-accent-hover text-[rgb(var(--on-primary))]"
                  }`}
                >
                  {dialog.opts.confirmLabel || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).toast;
}
export function useConfirm() {
  return useContext(ConfirmContext).confirm;
}
