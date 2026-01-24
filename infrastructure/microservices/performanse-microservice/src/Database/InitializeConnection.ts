import { Db } from "./DbConnectionPool";
import { initializeInitialData } from "./InitializeData";


export async function initialize_database() {
  try {
    await Db.initialize();
    console.log("\x1b[34m[DbConn@1.12.4]\x1b[0m Database connected");
    
     //  inicijalno punjenje baze
    await initializeInitialData(Db);

  } catch (err) {
    console.error("\x1b[31m[DbConn@1.12.4]\x1b[0m Error during DataSource initialization ", err);
  }
}