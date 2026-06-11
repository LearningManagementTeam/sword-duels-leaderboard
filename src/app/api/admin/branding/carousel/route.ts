import { NextResponse } from "next/server";
import { adminApiGuardResponse, requireAdminEmailApi } from "@/lib/admin-auth";
import {
  parseCarouselSlot,
  removeCarouselSlideSlot,
  uploadCarouselSlideFile,
} from "@/lib/branding-carousel";

export const runtime = "nodejs";
export const maxDuration = 60;

async function logCarouselAudit(
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
      details: { slot, path },
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
    const slot = parseCarouselSlot(formData.get("slot"));

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Choose an image file to upload." },
        { status: 400 }
      );
    }

    const result = await uploadCarouselSlideFile(email, slot, file);
    await logCarouselAudit(
      email,
      "upload_carousel_slide",
      slot,
      `carousel-${slot}`
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
    const slot = parseCarouselSlot(slotRaw);

    const result = await removeCarouselSlideSlot(email, slot);
    await logCarouselAudit(email, "remove_carousel_slide", slot);

    return NextResponse.json(result);
  } catch (e) {
    const guard = adminApiGuardResponse(e);
    if (guard) return guard;
    const message = e instanceof Error ? e.message : "Remove failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
