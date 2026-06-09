import {
  parseVisionRosterJson,
  ROSTER_VISION_SYSTEM_PROMPT,
  visionRosterToDirectoryRows,
} from "@/lib/employee-roster-vision";
import type { EmployeeDirectoryCsvRow } from "@/lib/employees-csv";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function rosterVisionModel(): string {
  return process.env.OPENAI_ROSTER_MODEL?.trim() || DEFAULT_MODEL;
}

function openAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to your environment to use roster screenshot import."
    );
  }
  return key;
}

export async function extractRosterEmployeesFromImage(
  file: Blob,
  mimeType: string
): Promise<{
  rows: EmployeeDirectoryCsvRow[];
  warnings: string[];
  errors: string[];
}> {
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      rows: [],
      warnings: [],
      errors: ["Image is too large. Use a screenshot under 8 MB."],
    };
  }

  if (!mimeType.startsWith("image/")) {
    return {
      rows: [],
      warnings: [],
      errors: ["Upload a PNG or JPG screenshot."],
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: rosterVisionModel(),
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ROSTER_VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all employee records from this branch rep roster screenshot.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      rows: [],
      warnings: [],
      errors: [
        `Vision extraction failed (${response.status}). ${detail.slice(0, 200)}`,
      ],
    };
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    return {
      rows: [],
      warnings: [],
      errors: ["Vision model returned an empty response."],
    };
  }

  try {
    const extraction = parseVisionRosterJson(content);
    const { rows, warnings } = visionRosterToDirectoryRows(extraction);

    if (!rows.length) {
      return {
        rows: [],
        warnings,
        errors: [
          "No employees found in screenshot. Use a clear image of the Varsity 1/2 roster table.",
        ],
      };
    }

    return { rows, warnings, errors: [] };
  } catch (e) {
    return {
      rows: [],
      warnings: [],
      errors: [
        e instanceof Error ? e.message : "Could not parse vision extraction.",
      ],
    };
  }
}
