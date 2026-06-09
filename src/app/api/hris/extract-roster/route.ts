import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminEmail } from "@/lib/admin-auth";
import { extractRosterEmployeesFromImages } from "@/lib/extract-roster-vision";

function filesFromFormData(formData: FormData) {
  const fromArray = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (fromArray.length) return fromArray;

  const single = formData.get("file");
  if (single instanceof File && single.size > 0) return [single];

  return [];
}

export async function POST(request: Request) {
  try {
    await requireAdminEmail();

    const formData = await request.formData();
    const files = filesFromFormData(formData);

    if (!files.length) {
      return NextResponse.json(
        { ok: false, error: "Choose one or more roster screenshots to upload." },
        { status: 400 }
      );
    }

    const result = await extractRosterEmployeesFromImages(
      files.map((file) => ({
        blob: file,
        mimeType: file.type || "image/png",
        fileName: file.name,
      }))
    );

    if (!result.rows.length) {
      return NextResponse.json(
        {
          ok: false,
          error: result.errors.join(" ") || "Roster extraction failed.",
          warnings: result.warnings,
          failedFiles: result.failedFiles,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      rows: result.rows,
      warnings: result.warnings,
      processedFiles: result.processedFiles,
      failedFiles: result.failedFiles,
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: e.message },
        { status: e.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Roster extraction failed.",
      },
      { status: 500 }
    );
  }
}
