import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminApiGuardResponse, requireAdminEmailApi } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  persistEmployeePhotoRemove,
  persistEmployeePhotoUpload,
} from "@/lib/employee-photo-upload";

function revalidateEmployeePhotoPaths() {
  revalidatePath("/admin/hris/employees");
}

async function logAudit(
  email: string,
  action: string,
  entity_type: string,
  entity_id: string,
  details: Record<string, unknown>
) {
  try {
    const service = await createServiceClient();
    await service.from("audit_log").insert({
      admin_email: email,
      action,
      entity_type,
      entity_id,
      details,
    });
  } catch (e) {
    console.error("audit_log insert failed:", e);
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireAdminEmailApi();
    const formData = await request.formData();
    const employeeId = formData.get("employeeId");
    const file = formData.get("file");

    if (typeof employeeId !== "string" || !employeeId.trim()) {
      return NextResponse.json(
        { ok: false, error: "Employee id is required." },
        { status: 400 }
      );
    }
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Choose a photo to upload." },
        { status: 400 }
      );
    }

    const result = await persistEmployeePhotoUpload(employeeId.trim(), file);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    await logAudit(email, "upload_employee_photo", "employee", employeeId, {
      photo_path: result.photoUrl,
    });
    revalidateEmployeePhotoPaths();
    return NextResponse.json(result);
  } catch (e) {
    const guard = adminApiGuardResponse(e);
    if (guard) return guard;
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Photo upload failed.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await requireAdminEmailApi();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Employee id is required." },
        { status: 400 }
      );
    }

    const result = await persistEmployeePhotoRemove(employeeId.trim());
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    await logAudit(email, "remove_employee_photo", "employee", employeeId, {});
    revalidateEmployeePhotoPaths();
    return NextResponse.json(result);
  } catch (e) {
    const guard = adminApiGuardResponse(e);
    if (guard) return guard;
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Photo remove failed.",
      },
      { status: 500 }
    );
  }
}
