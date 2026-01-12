# Plants Microservice

Minimalni CRUD servis za biljke (Express + TypeORM + MySQL).

## Zahtevi

- Node.js 18+
- MySQL 8+

## Setup

1. Kreiraj DB korisnika i bazu (CMD ili SQL klijent):
   ```sql
   CREATE DATABASE IF NOT EXISTS plants_db;
   CREATE USER IF NOT EXISTS 'plants_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON plants_db.* TO 'plants_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. Kopiraj `.env.example` u `.env` i popuni vrednosti.
3. Instaliraj zavisnosti:
   ```cmd
   npm install
   ```
4. Pokreni servis (dev):
   ```cmd
   npm run dev
   ```

## Env varijable

Vidi `.env.example`.

## Default port

- 5053 (može preko `PORT`)

## Endpoints (prefix: /api/v1)

- GET `/plants` — lista
- GET `/plants/:id` — po ID
- POST `/plants` — kreiranje
- PUT `/plants/:id` — izmena
- DELETE `/plants/:id` — brisanje

## Brzi test (CMD)

```cmd
curl -X POST http://localhost:5053/api/v1/plants -H "Content-Type: application/json" -d "{\"name\":\"Aloe Vera\",\"species\":\"Aloe\",\"price\":12.5,\"stock\":10}"
curl -X PUT http://localhost:5053/api/v1/plants/2 -H "Content-Type: application/json" -d "{\"price\":15.0,\"stock\":8}"
curl -X DELETE http://localhost:5053/api/v1/plants/2
```
