import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEmployeeRosterFromOcrText } from "./employee-roster-ocr";

describe("parseEmployeeRosterFromOcrText", () => {
  it("parses tab-separated roster with header", () => {
    const text = [
      "Name\tPosition\tID Number\tBranch Code",
      "Diana Chavez\tGaming Attendant\t72248\t671",
      "Cendylny Dar\tGaming Attendant\t72090\t671",
    ].join("\n");

    const { rows, errors } = parseEmployeeRosterFromOcrText(text);

    assert.equal(errors.length, 0);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]!.full_name, "Diana Chavez");
    assert.equal(rows[0]!.employee_no, "72248");
    assert.equal(rows[0]!.branch_code, "671");
  });

  it("parses space-separated compact roster lines without header", () => {
    const text = [
      "Diana Chavez Gaming Attendant 72248 671",
      "Darence Mae Sendayen Cashier 13986 415",
      "Renato Damaso Jr. Card Custodian 605",
    ].join("\n");

    const { rows, errors } = parseEmployeeRosterFromOcrText(text);

    assert.equal(errors.length, 0);
    assert.equal(rows.length, 3);
    assert.equal(rows[1]!.full_name, "Darence Mae Sendayen");
    assert.equal(rows[1]!.position, "Cashier");
    assert.equal(rows[2]!.branch_code, "605");
    assert.ok(rows[2]!.employee_no.startsWith("PENDING-"));
  });

  it("skips area header noise lines", () => {
    const text = [
      "AREA 1",
      "Diana Chavez Gaming Attendant 72248 671",
    ].join("\n");

    const { rows, errors } = parseEmployeeRosterFromOcrText(text);

    assert.equal(errors.length, 0);
    assert.equal(rows.length, 1);
  });
});
