import { notFound } from "next/navigation";
import {
  AdminDocBackLink,
  AdminMarkdownDoc,
} from "@/lib/admin-docs-markdown";
import { getAdminDocBySlug } from "@/lib/admin-system-catalog";

export const dynamic = "force-dynamic";

export default async function AdminDocViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getAdminDocBySlug(slug);
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminMarkdownDoc content={doc.content} />
      <AdminDocBackLink slug={slug} />
    </div>
  );
}
