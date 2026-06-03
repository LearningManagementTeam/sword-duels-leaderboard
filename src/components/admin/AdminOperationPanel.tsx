"use client";

export type StepStatus = "pending" | "active" | "done" | "error";

export interface OperationStep {
  id: string;
  label: string;
  detail?: string;
  status: StepStatus;
}

interface Props {
  title: string;
  steps: OperationStep[];
  error?: string | null;
  successMessage?: string | null;
  successDetail?: React.ReactNode;
  onDismiss?: () => void;
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-xs text-emerald-200 ring-1 ring-emerald-400/40"
        aria-hidden
      >
        ✓
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/25 text-xs text-red-200 ring-1 ring-red-400/40"
        aria-hidden
      >
        !
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center"
        aria-hidden
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300/80 border-t-transparent" />
      </span>
    );
  }
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sd-panel/80 ring-1 ring-emerald-900/50"
      aria-hidden
    >
      <span className="h-1.5 w-1.5 rounded-full bg-sd-muted/40" />
    </span>
  );
}

export function AdminOperationPanel({
  title,
  steps,
  error,
  successMessage,
  successDetail,
  onDismiss,
}: Props) {
  const isRunning = steps.some((s) => s.status === "active");
  const hasError = Boolean(error) || steps.some((s) => s.status === "error");

  const panelClass = successMessage
    ? "border-emerald-500/35 bg-emerald-950/30"
    : hasError
      ? "border-red-500/35 bg-red-950/25"
      : "border-emerald-500/25 bg-sd-panel/60";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isRunning}
      className={`rounded-xl border px-4 py-4 ${panelClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        {successMessage && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-xs text-sd-muted hover:text-white"
          >
            Dismiss
          </button>
        )}
      </div>

      {successMessage ? (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-2 text-sm text-emerald-100">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/30 text-xs">
              ✓
            </span>
            {successMessage}
          </p>
          {successDetail}
        </div>
      ) : (
        <ol className="mt-3 space-y-3">
          {steps.map((step) => (
            <li key={step.id} className="flex gap-3">
              <StepIcon status={step.status} />
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm leading-snug ${
                    step.status === "active"
                      ? "font-medium text-white"
                      : step.status === "done"
                        ? "text-emerald-100/90"
                        : step.status === "error"
                          ? "text-red-100"
                          : "text-sd-muted/75"
                  }`}
                >
                  {step.label}
                </p>
                {step.detail && (
                  <p className="mt-0.5 text-xs leading-relaxed text-sd-muted/70">
                    {step.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      )}
    </div>
  );
}

export function patchOperationStep(
  steps: OperationStep[],
  id: string,
  status: StepStatus
): OperationStep[] {
  return steps.map((s) => (s.id === id ? { ...s, status } : s));
}
