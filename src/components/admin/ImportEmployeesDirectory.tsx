"use client";

import { ImportEmployeesCsv } from "@/components/admin/ImportEmployeesCsv";
import { ImportEmployeesRosterVision } from "@/components/admin/ImportEmployeesRosterVision";

export function ImportEmployeesDirectory() {
  return (
    <section className="sd-neon-panel space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Import employees</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Bulk-load HR profiles from CSV (Excel export) or from branch rep roster
          screenshots. Updates existing records when the employee number matches.
        </p>
      </div>

      <ImportEmployeesCsv />
      <ImportEmployeesRosterVision />
    </section>
  );
}
