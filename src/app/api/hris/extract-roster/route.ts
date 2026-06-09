import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminEmail } from "@/lib/admin-auth";
import { extractRosterEmployeesFromImage } from "@/lib/extract-roster-vision";

export async function POST(request: Request) {
  try {
    await requireAdminEmail();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Choose a roster screenshot to upload." },
        { status: 400 }
      );
    }

    const mimeType =
      file instanceof File && file.type ? file.type : "image/png";

    const { rows, warnings, errors } = await extractRosterEmployeesFromImage(
      file,
      mimeType
    );

    if (errors.length) {
      return NextResponse.json(
        { ok: false, error: errors.join(" "), warnings },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, rows, warnings });
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
