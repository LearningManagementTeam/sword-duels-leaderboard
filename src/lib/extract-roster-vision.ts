import {
  mergeRosterDirectoryRows,
  parseVisionRosterJson,
  ROSTER_VISION_SYSTEM_PROMPT,
  visionRosterToDirectoryRows,
} from "@/lib/employee-roster-vision";
import type { EmployeeDirectoryCsvRow } from "@/lib/employees-csv";

/** gemini-2.0-flash was shut down 2026-06-01; override via GEMINI_ROSTER_MODEL. */
const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_BULK_FILES = 10;

export type RosterImageInput = {
  blob: Blob;
  mimeType: string;
  fileName?: string;
};

export type RosterBulkExtractionResult = {
  rows: EmployeeDirectoryCsvRow[];
  warnings: string[];
  errors: string[];
  processedFiles: number;
  failedFiles: Array<{ fileName: string; error: string }>;
};

function rosterVisionModel(): string {
  return (
    process.env.GEMINI_ROSTER_MODEL?.trim() ||
    process.env.GOOGLE_ROSTER_MODEL?.trim() ||
    DEFAULT_MODEL
  );
}

function geminiApiKey(): string {
  const key =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your environment to use roster screenshot import."
    );
  }
  return key;
}

async function callGeminiVision(
  mimeType: string,
  base64: string
): Promise<string> {
  const model = rosterVisionModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey())}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: ROSTER_VISION_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Extract all employee records from this branch rep roster screenshot.",
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Gemini extraction failed (${response.status}). ${detail.slice(0, 240)}`
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export async function extractRosterEmployeesFromImage(
  file: Blob,
  mimeType: string
): Promise<{
  rows: EmployeeDirectoryCsvRow[];
  warnings: string[];
  errors: string[];
}> {
  const bulk = await extractRosterEmployeesFromImages([
    { blob: file, mimeType },
  ]);

  return {
    rows: bulk.rows,
    warnings: bulk.warnings,
    errors: bulk.errors,
  };
}

export async function extractRosterEmployeesFromImages(
  files: RosterImageInput[]
): Promise<RosterBulkExtractionResult> {
  if (!files.length) {
    return {
      rows: [],
      warnings: [],
      errors: ["Choose at least one roster screenshot."],
      processedFiles: 0,
      failedFiles: [],
    };
  }

  if (files.length > MAX_BULK_FILES) {
    return {
      rows: [],
      warnings: [],
      errors: [`Upload at most ${MAX_BULK_FILES} screenshots at a time.`],
      processedFiles: 0,
      failedFiles: [],
    };
  }

  const rowGroups: EmployeeDirectoryCsvRow[][] = [];
  const batchWarnings: string[] = [];
  const failedFiles: Array<{ fileName: string; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const { blob, mimeType, fileName } = files[i]!;
    const label = fileName?.trim() || `Screenshot ${i + 1}`;

    if (blob.size > MAX_IMAGE_BYTES) {
      failedFiles.push({
        fileName: label,
        error: "Image is too large (max 8 MB).",
      });
      continue;
    }

    if (!mimeType.startsWith("image/")) {
      failedFiles.push({
        fileName: label,
        error: "File must be a PNG or JPG image.",
      });
      continue;
    }

    try {
      const buffer = Buffer.from(await blob.arrayBuffer());
      const base64 = buffer.toString("base64");
      const content = await callGeminiVision(mimeType, base64);
      const extraction = parseVisionRosterJson(content);
      const { rows, warnings } = visionRosterToDirectoryRows(extraction);

      if (!rows.length) {
        failedFiles.push({
          fileName: label,
          error: "No employees found in this screenshot.",
        });
        continue;
      }

      rowGroups.push(rows);
      if (warnings.length) {
        batchWarnings.push(`${label}: ${warnings.join(" ")}`);
      }
    } catch (e) {
      failedFiles.push({
        fileName: label,
        error: e instanceof Error ? e.message : "Extraction failed.",
      });
    }
  }

  if (!rowGroups.length) {
    return {
      rows: [],
      warnings: batchWarnings,
      errors: failedFiles.length
        ? failedFiles.map((f) => `${f.fileName}: ${f.error}`)
        : ["No employees could be extracted from the uploaded screenshots."],
      processedFiles: 0,
      failedFiles,
    };
  }

  const merged = mergeRosterDirectoryRows(rowGroups);
  const warnings = [...batchWarnings, ...merged.warnings];

  if (failedFiles.length) {
    warnings.push(
      `${failedFiles.length} screenshot${failedFiles.length === 1 ? "" : "s"} could not be read — see details below.`
    );
  }

  return {
    rows: merged.rows,
    warnings,
    errors: [],
    processedFiles: rowGroups.length,
    failedFiles,
  };
}
