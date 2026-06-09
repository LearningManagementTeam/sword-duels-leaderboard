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
    assert.equal(parsed!.date_hired, "2023-01-11");
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

  it("parses compact roster row (name, position, id, branch)", () => {
    const row = "Diana Chavez\tGaming Attendant\t72248\t671";
    const { row: parsed, errors } = parseEmployeeProfilePaste(row);

    assert.equal(errors.length, 0);
    assert.ok(parsed);
    assert.equal(parsed!.full_name, "Diana Chavez");
    assert.equal(parsed!.position, "Gaming Attendant");
    assert.equal(parsed!.employee_no, "72248");
    assert.equal(parsed!.branch_code, "671");
  });

  it("parses vertical label + value pairs from HR profile template", () => {
    const paste = [
      "Name\tSENDAYEN, DARENCE MAE C.",
      "Nickname\tDARA",
      "Position\tSENIOR/BRANCH CASHIER",
      "ID Number\t13986",
      "Date Hired\t1/11/2023",
      "Contact Number\t9679219459",
      "Email\tsendayend@gmail.com",
      "Branch Code\t415",
    ].join("\n");

    const { row: parsed, errors } = parseEmployeeProfilePaste(paste);

    assert.equal(errors.length, 0);
    assert.ok(parsed);
    assert.equal(parsed!.full_name, "SENDAYEN, DARENCE MAE C.");
    assert.equal(parsed!.nickname, "DARA");
    assert.equal(parsed!.employee_no, "13986");
    assert.equal(parsed!.date_hired, "2023-01-11");
    assert.equal(parsed!.contact_number, "9679219459");
    assert.equal(parsed!.branch_code, "415");
  });

  it("normalizes Excel serial dates and numeric phone cells", () => {
    const paste = [
      "Name\tJUAN DELA CRUZ",
      "ID Number\t13986",
      "Date Hired\t44937",
      "Contact Number\t9123456789",
    ].join("\n");

    const { row: parsed, errors } = parseEmployeeProfilePaste(paste);

    assert.equal(errors.length, 0);
    assert.ok(parsed);
    assert.equal(parsed!.employee_no, "13986");
    assert.equal(parsed!.date_hired, "2023-01-11");
    assert.equal(parsed!.contact_number, "9123456789");
  });

  it("converts scientific-notation phone when Excel stores as number", () => {
    const paste = ["Name\tJUAN DELA CRUZ", "Contact Number\t9.123456789E+09"].join(
      "\n"
    );
    const { row: parsed, errors } = parseEmployeeProfilePaste(paste);

    assert.equal(errors.length, 0);
    assert.ok(parsed);
    assert.equal(parsed!.contact_number, "9123456789");
  });

  it("rejects header-only paste", () => {
    const { errors } = parseEmployeeProfilePaste(
      EMPLOYEE_DIRECTORY_CSV_TEMPLATE_HEADER
    );
    assert.ok(errors.length > 0);
  });
});
