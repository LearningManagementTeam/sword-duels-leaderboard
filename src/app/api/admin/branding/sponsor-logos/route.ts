import { NextResponse } from "next/server";
import { adminApiGuardResponse, requireAdminEmailApi } from "@/lib/admin-auth";
import {
  parseSponsorLogoSlot,
  removeSponsorLogoSlot,
  uploadSponsorLogoFile,
} from "@/lib/branding-sponsor-logos";

export const runtime = "nodejs";
export const maxDuration = 60;

async function logSponsorLogoAudit(
  email: string,
  action: string,
  slot: number,
  path?: string
) {
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const service = await createServiceClient();
    await service.from("audit_log").insert({
      admin_email: email,
      action,
      entity_type: "site_content",
      entity_id: "branding",
      details: { slot, path, kind: "sponsor_logo" },
    });
  } catch {
    // non-fatal
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireAdminEmailApi();
    const formData = await request.formData();
    const file = formData.get("file");
    const slot = parseSponsorLogoSlot(formData.get("slot"));

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Choose an image file to upload." },
        { status: 400 }
      );
    }

    const result = await uploadSponsorLogoFile(email, slot, file);
    await logSponsorLogoAudit(
      email,
      "upload_sponsor_logo",
      slot,
      `sponsor-logo-${slot}`
    );

    return NextResponse.json(result);
  } catch (e) {
    const guard = adminApiGuardResponse(e);
    if (guard) return guard;
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await requireAdminEmailApi();
    const slotRaw = new URL(request.url).searchParams.get("slot");
    const slot = parseSponsorLogoSlot(slotRaw);

    const result = await removeSponsorLogoSlot(email, slot);
    await logSponsorLogoAudit(email, "remove_sponsor_logo", slot);

    return NextResponse.json(result);
  } catch (e) {
    const guard = adminApiGuardResponse(e);
    if (guard) return guard;
    const message = e instanceof Error ? e.message : "Remove failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
