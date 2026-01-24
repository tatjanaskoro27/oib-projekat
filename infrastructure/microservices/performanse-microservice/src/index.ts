console.clear();
import app from "./app";
import { initialize_database } from "./Database/InitializeConnection";

const port = process.env.PORT || 5000;

(async () => {
  try {
    await initialize_database();
    app.listen(port, () => {
      console.log(`\x1b[32m[TCPListen@2.1]\x1b[0m localhost:${port}`);
    });
  } catch (err) {
    console.error("Neuspešna inicijalizacija baze:", err);
    process.exit(1);
  }
})();
