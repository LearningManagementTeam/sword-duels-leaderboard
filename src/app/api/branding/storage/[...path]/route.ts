import { NextResponse } from "next/server";
import {
  isAllowedBrandingPath,
  mimeForBrandingPath,
} from "@/lib/branding-storage";
import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const path = segments.join("/");

  if (!isAllowedBrandingPath(path)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  try {
    const service = await createServiceClient();
    const { data, error } = await service.storage
      .from("branding")
      .download(path);

    if (error || !data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeForBrandingPath(path),
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
  }
}
