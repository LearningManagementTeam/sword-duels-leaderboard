import { parseEmployeeRosterFromOcrText } from "@/lib/employee-roster-ocr";
import type { EmployeeDirectoryCsvRow } from "@/lib/employees-csv";

export interface ExtractedEmployeeRoster {
  rows: EmployeeDirectoryCsvRow[];
  errors: string[];
  warnings: string[];
  rawText: string;
}

export async function extractEmployeeRosterFromImage(
  file: File,
  onProgress?: (message: string) => void
): Promise<ExtractedEmployeeRoster> {
  const { createWorker } = await import("tesseract.js");

  onProgress?.("Loading OCR engine…");
  const worker = await createWorker("eng");

  try {
    onProgress?.("Reading screenshot…");
    const {
      data: { text },
    } = await worker.recognize(file);

    onProgress?.("Parsing employee rows…");
    const { rows, errors, warnings } = parseEmployeeRosterFromOcrText(text);

    return { rows, errors, warnings, rawText: text };
  } finally {
    await worker.terminate();
  }
}
