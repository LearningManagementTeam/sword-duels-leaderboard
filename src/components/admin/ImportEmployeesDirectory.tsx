"use client";

import { ImportEmployeesRosterVision } from "@/components/admin/ImportEmployeesRosterVision";

export function ImportEmployeesDirectory() {
  return (
    <section className="sd-neon-panel space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Import employees</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Bulk-load HR employee profiles from your branch rep roster screenshot.
          Each filled Varsity 1 or Varsity 2 slot becomes one employee. Updates
          existing records when the employee number matches.
        </p>
      </div>

      <ImportEmployeesRosterVision />
    </section>
  );
}
