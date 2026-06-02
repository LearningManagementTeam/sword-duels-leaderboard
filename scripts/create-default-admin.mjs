/**
 * One-time: create Supabase Auth user + admins row.
 *
 * Run from project folder (do not commit passwords to git):
 *
 *   ADMIN_EMAIL=you@company.com \
 *   ADMIN_PASSWORD='your-secure-password' \
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/create-default-admin.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email =
  process.env.ADMIN_EMAIL ?? "learningmanagement2026@gmail.com";
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

if (!password || password.length < 8) {
  console.error("Missing ADMIN_PASSWORD (min 8 characters).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: created, error: createError } =
  await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

let userId = created?.user?.id;

if (createError) {
  if (createError.message?.includes("already been registered")) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!existing) {
      console.error("User exists but could not find id:", createError.message);
      process.exit(1);
    }
    userId = existing.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password }
    );
    if (updateError) {
      console.error("Could not update password:", updateError.message);
      process.exit(1);
    }
    console.log("User already exists — password updated.");
  } else {
    console.error("Create user failed:", createError.message);
    process.exit(1);
  }
} else {
  console.log("Auth user created.");
}

const { error: adminError } = await supabase.from("admins").upsert(
  { user_id: userId, email },
  { onConflict: "user_id" }
);

if (adminError) {
  console.error("admins table insert failed:", adminError.message);
  process.exit(1);
}

console.log("");
console.log("Default admin is ready.");
console.log("  Email:   ", email);
console.log("  Sign in: /admin/login on your Vercel site");
console.log("");
