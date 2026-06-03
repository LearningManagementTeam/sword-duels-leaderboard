"use client";

import { useState } from "react";
import Link from "next/link";
import { saveMechanicsContent } from "@/lib/actions/admin";
import { MechanicsPageContent } from "@/components/MechanicsPageContent";
import type {
  MechanicsCustomSection,
  MechanicsPublicBody,
} from "@/lib/mechanics-content";

interface Props {
  initial: MechanicsPublicBody;
}

function newSectionId() {
  return `sec-${Date.now().toString(36)}`;
}

export function MechanicsEditor({ initial }: Props) {
  const [content, setContent] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  async function handleSave() {
    setLoading(true);
    setMessage("");
    try {
      await saveMechanicsContent(content);
      setMessage("Saved. Public /mechanics page updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function updateSection(
    id: string,
    patch: Partial<MechanicsCustomSection>
  ) {
    setContent((c) => ({
      ...c,
      custom_sections: c.custom_sections.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    }));
  }

  function addSection() {
    setContent((c) => ({
      ...c,
      custom_sections: [
        ...c.custom_sections,
        { id: newSectionId(), title: "New section", body: "" },
      ],
    }));
  }

  function removeSection(id: string) {
    setContent((c) => ({
      ...c,
      custom_sections: c.custom_sections.filter((s) => s.id !== id),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Edit intro and announcements. Tables below are generated from system
          rules and cannot be edited here.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === "edit"
                ? "bg-amber-500 text-slate-900 font-medium"
                : "bg-slate-800 text-slate-200"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === "preview"
                ? "bg-amber-500 text-slate-900 font-medium"
                : "bg-slate-800 text-slate-200"
            }`}
          >
            Preview
          </button>
          <Link
            href="/mechanics"
            target="_blank"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            View public page
          </Link>
        </div>
      </div>

      {tab === "edit" ? (
        <div className="space-y-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Intro</span>
            <textarea
              value={content.intro}
              onChange={(e) =>
                setContent((c) => ({ ...c, intro: e.target.value }))
              }
              rows={4}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Announcements
            </span>
            <textarea
              value={content.announcements}
              onChange={(e) =>
                setContent((c) => ({ ...c, announcements: e.target.value }))
              }
              rows={5}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
              placeholder="Committee notes, schedule changes…"
            />
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-200">Custom sections</h2>
              <button
                type="button"
                onClick={addSection}
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                + Add section
              </button>
            </div>
            {content.custom_sections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 space-y-2"
              >
                <input
                  value={section.title}
                  onChange={(e) =>
                    updateSection(section.id, { title: e.target.value })
                  }
                  className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-white"
                  placeholder="Section title"
                />
                <textarea
                  value={section.body}
                  onChange={(e) =>
                    updateSection(section.id, { body: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove section
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save mechanics content"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-6">
          <MechanicsPageContent content={content} />
        </div>
      )}

      {message && <p className="text-sm text-amber-200">{message}</p>}
    </div>
  );
}
