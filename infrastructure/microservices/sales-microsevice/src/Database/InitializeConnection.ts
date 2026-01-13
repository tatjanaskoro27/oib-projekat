// src/Database/InitializeConnection.ts
import { Db } from "./DbConnectionPool";

export async function initialize_database() {
  try {
    await Db.initialize();
    console.log("\x1b[34m[DbConn@1.12.4]\x1b[0m Sales Database connected");
  } catch (err) {
    console.log("\x1b[33m[DbConn@1.12.4]\x1b[0m Running without database (MySQL not running)");
    // Ne exit-uj aplikaciju, samo loguj grešku
  }
}