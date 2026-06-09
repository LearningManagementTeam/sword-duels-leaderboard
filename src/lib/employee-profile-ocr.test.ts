import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseEmployeeProfileFromOcrText } from "./employee-profile-ocr";

describe("parseEmployeeProfileFromOcrText", () => {
  it("parses labeled HR fields", () => {
    const text = `
NAME: SENDAYEN, DARENCE MAE C.
NICKNAME: DARA
POSITION: SENIOR/BRANCH CASHIER
ID NUMBER: 13986
DATE HIRED: 1/11/2023
CONTACT NUMBER: 9679219459
EMAIL: sendayend@gmail.com
BRANCH CODE: 415
`;
    const result = parseEmployeeProfileFromOcrText(text);
    assert.equal(result.full_name, "SENDAYEN, DARENCE MAE C.");
    assert.equal(result.nickname, "DARA");
    assert.equal(result.employee_no, "13986");
    assert.equal(result.date_hired, "2023-01-11");
    assert.equal(result.contact_number, "9679219459");
    assert.equal(result.email, "sendayend@gmail.com");
    assert.equal(result.branch_code, "415");
  });

  it("extracts email and phone from loose OCR text", () => {
    const text = "Some row data sendayend@gmail.com 09171234567 13986";
    const result = parseEmployeeProfileFromOcrText(text);
    assert.equal(result.email, "sendayend@gmail.com");
    assert.ok(result.contact_number);
  });
});
