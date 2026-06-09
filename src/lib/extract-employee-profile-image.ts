import {
  extractedFieldLabels,
  parseEmployeeProfileFromOcrText,
  type ExtractedEmployeeProfile,
} from "@/lib/employee-profile-ocr";

export type { ExtractedEmployeeProfile };

export interface EmployeeProfileExtractionResult {
  extracted: ExtractedEmployeeProfile;
  filledLabels: string[];
  rawText: string;
}

/** Run OCR on an image file and parse HR profile fields. */
export async function extractEmployeeProfileFromImage(
  file: File,
  onProgress?: (message: string) => void
): Promise<EmployeeProfileExtractionResult> {
  onProgress?.("Loading OCR…");

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  try {
    onProgress?.("Reading screenshot…");
    const { data } = await worker.recognize(file);
    const rawText = data.text?.trim() ?? "";

    if (!rawText) {
      throw new Error("No text found in the image. Try a clearer screenshot.");
    }

    onProgress?.("Extracting fields…");
    const extracted = parseEmployeeProfileFromOcrText(rawText);

    if (extractedFieldLabels(extracted).length === 0) {
      throw new Error(
        "Could not match HR fields in the image. Use a clearer screenshot of the employee row or profile."
      );
    }

    return {
      extracted,
      filledLabels: extractedFieldLabels(extracted),
      rawText,
    };
  } finally {
    await worker.terminate();
  }
}
