"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AdminActionHint, AdminActionRow } from "@/components/admin/AdminActionHint";
import {
  getJuneImportGuard,
  importParticipatingBranchesForJuneArea,
  previewParticipatingBranchesImport,
} from "@/lib/actions/admin";
import { ADMIN_ROSTER_HINTS } from "@/lib/admin-action-hints";
import { REGION_LABELS, type Region } from "@/lib/scoring-config";

type PreviewState = {
  rowCount: number;
  regionCounts: Record<Region, number>;
  representativesCount: number;
  sampleBranches: string[];
  errors: string[];
};

type GuardState = {
  blocked: boolean;
  warning: boolean;
  publishedRoundNumbers: number[];
  message: string | null;
};

export function ImportParticipatingBranches() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [guard, setGuard] = useState<GuardState | null>(null);
  const [acknowledgeReimport, setAcknowledgeReimport] = useState(false);

  useEffect(() => {
    getJuneImportGuard()
      .then(setGuard)
      .catch(() => {
        setGuard({
          blocked: false,
          warning: false,
          publishedRoundNumbers: [],
          message: null,
        });
      });
  }, []);

  async function loadPreview(text: string) {
    setPreviewLoading(true);
    try {
      const result = await previewParticipatingBranchesImport(text);
      setPreview({
        rowCount: result.rowCount,
        regionCounts: result.regionCounts,
        representativesCount: result.representativesCount,
        sampleBranches: result.sampleBranches,
        errors: result.errors,
      });
      setError(result.errors.length > 0);
      if (result.errors.length > 0) {
        setMessage(result.errors.join(" "));
      } else {
        setMessage("");
      }
    } catch (e) {
      setPreview(null);
      setError(true);
      setMessage(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleFileChange(file: File | undefined) {
    setFileName(file?.name ?? "");
    setMessage("");
    setError(false);
    setPreview(null);
    setAcknowledgeReimport(false);

    if (!file) {
      setCsvText("");
      return;
    }

    const text = await file.text();
    setCsvText(text);
    await loadPreview(text);
  }

  const importBlocked =
    guard?.blocked ||
    preview?.errors.length ||
    preview != null && preview.rowCount < 130;

  const needsReimportAck = guard?.warning && !guard.blocked;

  async function handleImport() {
    const file = inputRef.current?.files?.[0];
    if (!file || !csvText) {
      setError(true);
      setMessage("Please choose a CSV file first.");
      return;
    }

    if (guard?.blocked) {
      setError(true);
      setMessage(guard.message ?? "Import blocked while June rounds are live.");
      return;
    }

    if (needsReimportAck && !acknowledgeReimport) {
      setError(true);
      setMessage("Check the confirmation box before re-importing over a live Round 1.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const result = await importParticipatingBranchesForJuneArea(csvText, {
        force: needsReimportAck ? acknowledgeReimport : undefined,
      });
      if (result.ok) {
        setError(false);
        setMessage(
          result.roundId
            ? `${result.message} Go to Rounds → June — Round 1 to enter scores.`
            : result.message
        );
        const nextGuard = await getJuneImportGuard();
        setGuard(nextGuard);
      } else {
        setError(true);
        setMessage(result.errors.join(" "));
      }
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sd-neon-panel space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-sd-glow">
          Import participants (one CSV)
        </h2>
        <p className="mt-1 text-sm text-sd-muted">
          One file for <strong>branches, areas, regions, and representative
          names</strong>. Requires at least 130 rows for June Area-wide.
          Representative columns are optional — leave blank and add names later
          in Admin → Representatives. Excel:{" "}
          <strong>File → Save As → CSV UTF-8</strong>. Quote branch names that
          contain commas.
        </p>
      </div>

      {guard?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            guard.blocked ? "sd-alert-warning" : "sd-alert-info"
          }`}
        >
          <p>{guard.message}</p>
          {guard.publishedRoundNumbers.length > 0 && (
            <p className="mt-1 text-xs opacity-80">
              Published June rounds: {guard.publishedRoundNumbers.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminActionRow hint={ADMIN_ROSTER_HINTS.downloadTemplate}>
          <a
            href="/templates/participants-import-template.csv"
            download="participants-import-template.csv"
            className="sd-btn-ghost inline-flex rounded-lg px-4 py-2 text-sm text-sd-muted hover:bg-emerald-500/10"
          >
            Download combined template
          </a>
        </AdminActionRow>
        <AdminActionRow hint={ADMIN_ROSTER_HINTS.editRepresentatives}>
          <Link
            href="/admin/representatives"
            className="sd-btn-ghost inline-flex rounded-lg px-4 py-2 text-sm text-sd-muted hover:bg-emerald-500/10"
          >
            Edit representatives
          </Link>
        </AdminActionRow>
        <AdminActionRow hint={ADMIN_ROSTER_HINTS.goToRounds}>
          <Link
            href="/admin/rounds"
            className="sd-btn-ghost inline-flex rounded-lg px-4 py-2 text-sm text-sd-muted hover:bg-emerald-500/10"
          >
            Go to Rounds
          </Link>
        </AdminActionRow>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-sd-muted/60">
          Columns
        </p>
        <code className="sd-inset block rounded-lg px-3 py-2 text-sm text-sd-muted">
          branch_code, branch_name, area, region, representative_1,
          representative_2
        </code>
        <p className="text-xs text-sd-muted/60">
          <strong>Required:</strong> first four columns.{" "}
          <strong>Optional:</strong> representative_1, representative_2 (can be
          empty). Region: <code>luzon</code>, <code>ncr</code>, or{" "}
          <code>vismin</code>.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-sd-muted">
          Upload participants CSV
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full max-w-md text-sm text-sd-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-sd-lime file:to-emerald-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sd-deep"
            onChange={(e) => {
              void handleFileChange(e.target.files?.[0]);
            }}
          />
        </label>
        {fileName && (
          <p className="text-xs text-sd-muted/60">Selected: {fileName}</p>
        )}
      </div>

      {previewLoading && (
        <p className="text-sm text-sd-muted">Validating CSV…</p>
      )}

      {preview && preview.errors.length === 0 && (
        <div className="sd-inset space-y-2 rounded-xl p-4 text-sm">
          <p className="font-medium text-sd-glow">Import preview</p>
          <AdminActionHint hint={ADMIN_ROSTER_HINTS.importJunePreview} />
          <dl className="mt-2 grid gap-1 text-sd-muted">
            <div className="flex justify-between gap-2">
              <dt>Total branches</dt>
              <dd className="tabular-nums text-white">{preview.rowCount}</dd>
            </div>
            {(["luzon", "ncr", "vismin"] as Region[]).map((region) => (
              <div key={region} className="flex justify-between gap-2">
                <dt>{REGION_LABELS[region]}</dt>
                <dd className="tabular-nums">{preview.regionCounts[region]}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-2">
              <dt>With representatives</dt>
              <dd className="tabular-nums">{preview.representativesCount}</dd>
            </div>
          </dl>
          {preview.sampleBranches.length > 0 && (
            <p className="text-xs text-sd-muted/70">
              First branches: {preview.sampleBranches.join(", ")}
              {preview.rowCount > preview.sampleBranches.length ? "…" : ""}
            </p>
          )}
          {preview.rowCount < 130 && (
            <p className="text-xs text-amber-200">
              Need at least 130 rows for June Area-wide (file has{" "}
              {preview.rowCount}).
            </p>
          )}
        </div>
      )}

      {needsReimportAck && (
        <label className="flex items-start gap-2 text-sm text-sd-muted">
          <input
            type="checkbox"
            checked={acknowledgeReimport}
            onChange={(e) => setAcknowledgeReimport(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-amber-400/50"
          />
          <span>
            I understand this re-import may replace branch data and re-seed June
            Round 1 rows while scores are already live.
          </span>
        </label>
      )}

      <AdminActionRow hint={ADMIN_ROSTER_HINTS.importJune}>
        <button
          type="button"
          disabled={loading || Boolean(importBlocked) || previewLoading || !preview}
          onClick={handleImport}
          className="sd-btn-primary rounded-lg px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? "Importing…" : "Import for June Round 1"}
        </button>
      </AdminActionRow>
      {guard?.warning && !guard.blocked && (
        <AdminActionHint hint={ADMIN_ROSTER_HINTS.importJuneBlocked} />
      )}

      {message && (
        <p
          className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
