import "reflect-metadata";
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3002;

app.listen(port, () => {
    console.log(`\x1b[32m[TCPListen@${port}] Sales microservice started\x1b[0m`);
    console.log(`Health: http://localhost:${port}/health`);
});