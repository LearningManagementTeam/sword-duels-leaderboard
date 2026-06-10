import {
  isProvisionalEmployeeNo,
  normalizeEmployeeNo,
} from "@/lib/employee-numbers";
import { normalizeAllCapsText } from "@/lib/text-format";

export { normalizeEmployeeNo } from "@/lib/employee-numbers";

function employeeNumbersMatch(a: string, b: string): boolean {
  return (
    normalizeEmployeeNo(a).toLowerCase() === normalizeEmployeeNo(b).toLowerCase()
  );
}

function fullNamesMatch(a: string, b: string): boolean {
  return (
    normalizeAllCapsText(a.trim()).toLowerCase() ===
    normalizeAllCapsText(b.trim()).toLowerCase()
  );
}

export type EmployeeDuplicateRow = {
  id: string;
  employee_no: string;
  full_name: string;
};

/** Returns a user-facing message when fields match an existing directory row. */
export function findEmployeeDirectoryDuplicateMessage(
  roster: EmployeeDuplicateRow[],
  fields: { employee_no: string; full_name: string },
  excludeId?: string
): string | null {
  const employeeNo = normalizeEmployeeNo(fields.employee_no);
  if (employeeNo && !isProvisionalEmployeeNo(employeeNo)) {
    for (const row of roster) {
      if (excludeId && row.id === excludeId) continue;
      if (isProvisionalEmployeeNo(row.employee_no)) continue;
      if (employeeNumbersMatch(row.employee_no, employeeNo)) {
        return `Employee number ${row.employee_no} is already assigned to ${row.full_name}.`;
      }
    }
  }

  const fullName = fields.full_name.trim();
  if (fullName) {
    for (const row of roster) {
      if (excludeId && row.id === excludeId) continue;
      if (fullNamesMatch(row.full_name, fullName)) {
        return `An employee named ${row.full_name} already exists (employee no. ${row.employee_no}).`;
      }
    }
  }

  return null;
}
