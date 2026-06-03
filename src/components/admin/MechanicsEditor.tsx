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
        <p className="text-sm text-sd-muted">
          Edit intro and announcements. Tables below are generated from system
          rules and cannot be edited here.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === "edit"
                ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                : "sd-glass text-sd-muted"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === "preview"
                ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                : "sd-glass text-sd-muted"
            }`}
          >
            Preview
          </button>
          <Link
            href="/mechanics"
            target="_blank"
            className="sd-btn-ghost rounded-lg px-3 py-1.5 text-sm text-sd-muted hover:bg-emerald-500/10"
          >
            View public page
          </Link>
        </div>
      </div>

      {tab === "edit" ? (
        <div className="space-y-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-sd-muted">Intro</span>
            <textarea
              value={content.intro}
              onChange={(e) =>
                setContent((c) => ({ ...c, intro: e.target.value }))
              }
              rows={4}
              className="w-full rounded-lg sd-input px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-sd-muted">
              Announcements
            </span>
            <textarea
              value={content.announcements}
              onChange={(e) =>
                setContent((c) => ({ ...c, announcements: e.target.value }))
              }
              rows={5}
              className="w-full rounded-lg sd-input px-3 py-2 text-sm text-white"
              placeholder="Committee notes, schedule changes…"
            />
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sd-muted">Custom sections</h2>
              <button
                type="button"
                onClick={addSection}
                className="sd-link text-sm"
              >
                + Add section
              </button>
            </div>
            {content.custom_sections.map((section) => (
              <div
                key={section.id}
                className="sd-neon-panel/50 p-4 space-y-2"
              >
                <input
                  value={section.title}
                  onChange={(e) =>
                    updateSection(section.id, { title: e.target.value })
                  }
                  className="w-full rounded sd-input px-2 py-1 text-sm text-white"
                  placeholder="Section title"
                />
                <textarea
                  value={section.body}
                  onChange={(e) =>
                    updateSection(section.id, { body: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded sd-input px-2 py-1 text-sm text-white"
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
            className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save mechanics content"}
          </button>
        </div>
      ) : (
        <div className="sd-neon-panel p-6">
          <MechanicsPageContent content={content} />
        </div>
      )}

      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
