console.clear();
import app from "./app";

const port = process.env.PORT || 5053;
app.listen(port, () => {
  console.log(`\x1b[32m[TCPListen@plants]\x1b[0m localhost:${port}`);
});
