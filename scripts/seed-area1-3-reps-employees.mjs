/**
 * One-off seed: Area 1–3 branch rep employees from Sword Duels roster sheet.
 * Run: node scripts/seed-area1-3-reps-employees.mjs
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */

const employees = [
  ["72248", "Diana Chavez", "Gaming Attendant", "671"],
  ["72090", "Cendylny Dar", "Gaming Attendant", "671"],
  ["13986", "Darence Mae Sendayen", "Cashier", "415"],
  ["13991", "Jayson Roldan", "Cashier", "415"],
  ["15133", "Aiza P. Miguel", "Operations Supervisor", "556"],
  ["15937", "John Francis C. Dela Umbria", "Card Custodian", "556"],
  ["72396", "Marnell Agana", "Gaming Attendant", "623"],
  ["15064", "Mutya Omega Frias", "Cashier", "421"],
  ["71691", "Cristina Mae Ramos", "Gaming Attendant", "421"],
  ["70161", "Mary Joyce Lim", "Gaming Attendant", "606"],
  ["71737", "Jennylyn Mañozo", "Gaming Attendant", "606"],
  ["13990", "Kristine Padilla", "Senior Cashier", "416"],
  ["72292", "Joy Estrada", "Gaming Attendant", "416"],
  ["69124", "Glaiza Mae Quiballo", "Gaming Attendant", "703"],
  ["72015", "Geraldine Macaraig", "Gaming Attendant", "703"],
  ["67847", "Marvin Dullas", "Gaming Attendant", "557"],
  ["102274", "Mark Andrei De Guzman", "Bingo Technician", "557"],
  ["12363", "Efren C. Panit Jr", "Operations Supervisor", "810"],
  ["12713", "Jayson Dela Cruz", "Operations Supervisor", "810"],
  ["15131", "Michael Bernardino", "Senior Cashier", "707"],
  ["72277", "Angelica Carera", "Gaming Attendant", "707"],
  ["69212", "Aira T. Gamboa", "Gaming Attendant", "656"],
  ["70014", "Lerma Esteban", "Gaming Attendant", "515"],
  ["71669", "Genesis Grace Domingo", "Gaming Attendant", "515"],
  ["71584", "Jefferson Guillermo", "Gaming Attendant", "414"],
  ["70515", "Angelo Miclat", "Gaming Attendant", "414"],
  ["72362", "Claire Castillo", "Gaming Attendant", "533"],
  ["67565", "Felipe Corpuz", "Gaming Attendant", "533"],
  ["13764", "Erma Mercader", "Operations Supervisor", "750"],
  ["70145", "Eulanda Asuncion", "Gaming Attendant", "750"],
  ["71882", "Leonalie Reyes", "Gaming Attendant", "422"],
  ["71897", "Diana Rose Caperlac", "Gaming Attendant", "422"],
  ["71525", "Maricel Cayabyab", "Gaming Attendant", "417"],
  ["71360", "Cherry Mae Santos", "Gaming Attendant", "417"],
  ["70123", "Kristoff Castillo", "Gaming Attendant", "513"],
  ["70756", "Marc Rhian Ramiro", "Gaming Attendant", "513"],
  ["69491", "Gener Cabezon", "Gaming Attendant", "672"],
  ["71279", "Ivy Jett Santos", "Gaming Attendant", "672"],
  ["68520", "Christian Alda", "Gaming Attendant", "968"],
  ["16018", "Ena Rose Dimarucot", "Cashier", "968"],
  ["LEGACY-605-1", "Renato Damaso Jr.", "Card Custodian", "605"],
  ["LEGACY-605-2", "Julius Buenaventura", "Gaming Attendant", "605"],
  ["LEGACY-664-1", "Krystlle Joy Muncal", "Gaming Attendant", "664"],
  ["LEGACY-664-2", "John Alvin Bagsik", "Gaming Attendant", "664"],
];

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const branchCodes = [...new Set(employees.map((e) => e[3]))];
const branchRes = await fetch(
  `${url}/rest/v1/branches?select=id,branch_code&branch_code=in.(${branchCodes.join(",")})`,
  {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  }
);
if (!branchRes.ok) {
  console.error("Failed to load branches:", await branchRes.text());
  process.exit(1);
}
const branches = await branchRes.json();
const branchByCode = new Map(branches.map((b) => [b.branch_code, b.id]));

let upserted = 0;
const errors = [];

for (const [employee_no, full_name, position, branch_code] of employees) {
  const home_branch_id = branchByCode.get(branch_code);
  if (!home_branch_id) {
    errors.push(`${employee_no}: unknown branch ${branch_code}`);
    continue;
  }

  const existingRes = await fetch(
    `${url}/rest/v1/employees?employee_no=eq.${encodeURIComponent(employee_no)}&select=id`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );
  const existing = await existingRes.json();
  const now = new Date().toISOString();
  const body = {
    employee_no,
    full_name,
    position,
    employment_status: "active",
    home_branch_id,
    updated_at: now,
  };

  let res;
  if (existing?.[0]?.id) {
    res = await fetch(
      `${url}/rest/v1/employees?id=eq.${existing[0].id}`,
      {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      }
    );
  } else {
    res = await fetch(`${url}/rest/v1/employees`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ ...body, created_at: now }),
    });
  }

  if (!res.ok) {
    errors.push(`${employee_no} ${full_name}: ${await res.text()}`);
  } else {
    upserted++;
  }
}

console.log(`Upserted ${upserted} of ${employees.length} employees.`);
if (errors.length) {
  console.error("Errors:");
  for (const e of errors) console.error(" ", e);
  process.exit(1);
}
