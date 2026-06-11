import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeRepSlotInputs } from "./representatives-csv";

describe("mergeRepSlotInputs", () => {
  it("keeps existing fields when already set", () => {
    const existing = {
      full_name: "Rochelle Villanueva",
      employee_no: "71838",
      position: "Gaming Attendant",
    };
    const incoming = {
      full_name: "Different Name",
      employee_no: "99999",
      position: "Cashier",
    };
    const merged = mergeRepSlotInputs(existing, incoming);
    assert.equal(merged?.full_name, "Rochelle Villanueva");
    assert.equal(merged?.employee_no, "71838");
    assert.equal(merged?.position, "Gaming Attendant");
  });

  it("fills empty fields from incoming CSV", () => {
    const existing = {
      full_name: "Rochelle Villanueva",
      employee_no: "",
      position: "Gaming Attendant",
    };
    const incoming = {
      full_name: "Rochelle Villanueva",
      employee_no: "71838",
      position: "",
    };
    const merged = mergeRepSlotInputs(existing, incoming);
    assert.equal(merged?.full_name, "Rochelle Villanueva");
    assert.equal(merged?.employee_no, "71838");
    assert.equal(merged?.position, "Gaming Attendant");
  });

  it("adds reps when branch slot was empty", () => {
    const merged = mergeRepSlotInputs(null, {
      full_name: "Krysha Lyne Rafanan",
      employee_no: "",
      position: "Gaming Attendant",
    });
    assert.equal(merged?.full_name, "Krysha Lyne Rafanan");
    assert.equal(merged?.employee_no, "");
    assert.equal(merged?.position, "Gaming Attendant");
  });
});
