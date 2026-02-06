import { Db } from "./DbConnectionPool";
import { Skladiste } from "../Domain/models/Skladiste";
import fs from "fs";
import path from "path";

async function seedSkladistaIfEmpty() {
  const repo = Db.getRepository(Skladiste);
  const count = await repo.count();

  if (count > 0) {
    console.log("\x1b[36m[Seed]\x1b[0m Skladiste: preskacem (vec ima skladista)");
    return;
  }

  const filePath = path.join(__dirname, "initial-skladista.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const items = JSON.parse(raw);

  const entities = items.map((s: any) =>
    repo.create({
      naziv: s.naziv,
      lokacija: s.lokacija,
      maksimalanBrojAmbalaza: Number(s.maksimalanBrojAmbalaza),
    })
  );

  await repo.save(entities);
  console.log("\x1b[36m[Seed]\x1b[0m Skladiste: ubaceno", entities.length);
}

export async function initialize_database() {
  try {
    await Db.initialize();
    console.log("\x1b[34m[DbConn@1.12.4]\x1b[0m Database connected");

    const runSeed = (process.env.RUN_SEED ?? "true").toLowerCase() === "true";
    if (runSeed) await seedSkladistaIfEmpty();
  } catch (err) {
    console.error("\x1b[31m[DbConn@1.12.4]\x1b[0m Error during DataSource initialization ", err);
  }
}
