import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeRosterDirectoryRows,
  parseVisionRosterJson,
  visionRosterToDirectoryRows,
} from "./employee-roster-vision";

describe("employee-roster-vision", () => {
  it("parses vision JSON and expands varsity reps per branch row", () => {
    const json = JSON.stringify({
      employees: [
        {
          full_name: "Jessa Fernandez",
          employee_no: "71962",
          position: "Gaming Attendant",
          branch_code: "65",
        },
        {
          full_name: "Trisha Mae Santos",
          employee_no: "72310",
          position: "Gaming Attendant",
          branch_code: "65",
        },
        {
          full_name: "Carla Joy Geronimo",
          employee_no: "13918",
          position: "Senior Cashier",
          branch_code: "598",
        },
      ],
    });

    const extraction = parseVisionRosterJson(json);
    const { rows, warnings } = visionRosterToDirectoryRows(extraction);

    assert.equal(rows.length, 3);
    assert.equal(rows[0]!.full_name, "Jessa Fernandez");
    assert.equal(rows[0]!.branch_code, "65");
    assert.equal(warnings.length, 0);
  });

  it("assigns provisional id when employee number is blank", () => {
    const { rows, warnings } = visionRosterToDirectoryRows({
      employees: [
        {
          full_name: "Renato Damaso Jr.",
          employee_no: null,
          position: "Card Custodian",
          branch_code: "605",
        },
      ],
    });

    assert.equal(rows.length, 1);
    assert.ok(rows[0]!.employee_no.startsWith("PENDING-605-"));
    assert.ok(warnings.length > 0);
  });

  it("merges rows from multiple batches and skips duplicate ids", () => {
    const { rows, warnings } = mergeRosterDirectoryRows([
      [
        {
          employee_no: "71962",
          full_name: "Jessa Fernandez",
          branch_code: "65",
        },
      ],
      [
        {
          employee_no: "71962",
          full_name: "Jessa Fernandez",
          branch_code: "65",
        },
        {
          employee_no: "72310",
          full_name: "Trisha Mae Santos",
          branch_code: "65",
        },
      ],
    ]);

    assert.equal(rows.length, 2);
    assert.ok(warnings.some((w) => w.includes("Duplicate skipped")));
  });
});
