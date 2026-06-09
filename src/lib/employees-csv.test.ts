import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER,
  parseEmployeeProfilePaste,
} from "./employees-csv";

describe("parseEmployeeProfilePaste", () => {
  it("parses header + tab-separated row from Excel", () => {
    const header = EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER.replace(/,/g, "\t");
    const row =
      "SENDAYEN, DARENCE MAE C.\tDARA\tSENIOR/BRANCH CASHIER\t13986\t1/11/2023\t9679219459\tsendayend@gmail.com\t415\tBAYAMBANG\tAREA 1";
    const { row: parsed, errors } = parseEmployeeProfilePaste(`${header}\n${row}`);

    assert.equal(errors.length, 0);
    assert.ok(parsed);
    assert.equal(parsed!.full_name, "SENDAYEN, DARENCE MAE C.");
    assert.equal(parsed!.nickname, "DARA");
    assert.equal(parsed!.employee_no, "13986");
    assert.equal(parsed!.branch_code, "415");
    assert.equal(parsed!.email, "sendayend@gmail.com");
  });

  it("parses a single data row without header using template column order", () => {
    const row =
      "JUAN DELA CRUZ\tJUAN\tCASHIER\tA12345\t2/1/2024\t9123456789\tjuan@example.com\t605";
    const { row: parsed, errors } = parseEmployeeProfilePaste(row);

    assert.equal(errors.length, 0);
    assert.ok(parsed);
    assert.equal(parsed!.full_name, "JUAN DELA CRUZ");
    assert.equal(parsed!.employee_no, "A12345");
    assert.equal(parsed!.branch_code, "605");
  });

  it("rejects header-only paste", () => {
    const { errors } = parseEmployeeProfilePaste(
      EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER
    );
    assert.ok(errors.length > 0);
  });
});
