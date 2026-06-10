import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPLOYEE_NO_PENDING_LABEL,
  formatEmployeeNoDisplay,
  isProvisionalEmployeeNo,
  resolveEmployeeNoForSave,
} from "./employee-numbers";

describe("employee-numbers", () => {
  it("treats PENDING and LEGACY prefixes as provisional", () => {
    assert.equal(isProvisionalEmployeeNo("PENDING-415-JUAN"), true);
    assert.equal(isProvisionalEmployeeNo("LEGACY-605-1"), true);
    assert.equal(isProvisionalEmployeeNo("13986"), false);
  });

  it("formats provisional numbers as Pending ID", () => {
    assert.equal(
      formatEmployeeNoDisplay("PENDING-UNK-MARIA-SANTOS"),
      EMPLOYEE_NO_PENDING_LABEL
    );
    assert.equal(formatEmployeeNoDisplay("72248"), "72248");
  });

  it("assigns a provisional id when employee number is blank on create", () => {
    const resolved = resolveEmployeeNoForSave("", {
      fullName: "Maria Santos",
      branchCode: "415",
    });
    assert.match(resolved, /^PENDING-415-MARIA/);
  });

  it("keeps existing provisional id when field is left blank on edit", () => {
    const existing = "PENDING-415-MARIA-SANTOS";
    const resolved = resolveEmployeeNoForSave("", {
      fullName: "Maria Santos",
      branchCode: "415",
      existingEmployeeNo: existing,
    });
    assert.equal(resolved, existing);
  });

  it("uses explicit employee number when provided", () => {
    const resolved = resolveEmployeeNoForSave(" 13986 ", {
      fullName: "Maria Santos",
      branchCode: "415",
      existingEmployeeNo: "PENDING-415-MARIA",
    });
    assert.equal(resolved, "13986");
  });
});
