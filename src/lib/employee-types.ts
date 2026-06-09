export type EmploymentStatus = "active" | "resigned" | "on_leave";

export interface Employee {
  id: string;
  employee_no: string;
  full_name: string;
  position: string | null;
  nickname: string | null;
  date_hired: string | null;
  contact_number: string | null;
  email: string | null;
  employment_status: EmploymentStatus;
  resigned_at: string | null;
  notes: string | null;
  photo_path: string | null;
  home_branch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrisBranchOption {
  id: string;
  branch_code: string;
  branch_name: string;
  area: string | null;
}

export interface EmployeeRepAssignment {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  slot: 1 | 2;
}

export interface EmployeeAdminRow extends Employee {
  home_branch_code: string | null;
  home_branch_name: string | null;
  rep_assignments: EmployeeRepAssignment[];
}

/** Lightweight row for representative assignment picker. */
export type EmployeePickerRow = Pick<
  Employee,
  "id" | "employee_no" | "full_name" | "position" | "photo_path" | "employment_status"
>;

export function employmentStatusLabel(status: EmploymentStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "resigned":
      return "Resigned";
    case "on_leave":
      return "On leave";
  }
}
