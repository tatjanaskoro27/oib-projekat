import { Db } from "./DbConnectionPool";

export async function initialize_database() {
  try {
    console.log(
      `\x1b[34m[DbConn@plants]\x1b[0m Using host=${process.env.DB_HOST} db=${process.env.DB_NAME} user=${process.env.DB_USER}`
    );
    await Db.initialize();
    console.log("\x1b[34m[DbConn@plants]\x1b[0m Database connected");
  } catch (err) {
    console.error(
      "\x1b[31m[DbConn@plants]\x1b[0m Error during DataSource initialization",
      err
    );
  }
}
