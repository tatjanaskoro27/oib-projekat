// src/Database/InitializeConnection.ts
import { Db } from "./DbConnectionPool";

export async function initialize_database() {
  try {
    await Db.initialize();
    console.log("\x1b[34m[DbConn]\x1b[0m Sales Database connected");
  } catch (err) {
    console.error("\x1b[31m[DbConn]\x1b[0m Database connection FAILED");
    console.error(err);
    process.exit(1);
  }
}
