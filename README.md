# AIS Viewer

This project provides a system for viewing AIS (Automatic Identification System) data, composed of a backend service, a web frontend and a mobile application.

- [Backend](#backend)
- [Frontend Web](#frontend-web)
- [Frontend Mobile](#frontend-mobile)

## Backend

**Name:** `ais-viewer-backend`

This is a Node.js backend service built with Fastify. It ingests AIS data from aisstream.io and saves the AIS data in a PostgreSQL database with the PostGIS extension. It also allows querying its data by a given bounding box.

### Environment Variables

To run the backend, you need to set up the following environment variables. You can create a `.env` file in the `backend` directory to store these:

- `PORT`: (Optional) The port the server will listen on. Defaults to `3000`.
- `AISSTREAM_API_KEY`: (Required) Your API key for the [aisstream.io](https://aisstream.io/) service, used for ingesting AIS data.
- `PGUSER`: Username for the PostgreSQL database.
- `PGPASSWORD`: Password for the PostgreSQL database.
- `PGDATABASE`: Name of the PostgreSQL database (e.g., `ais_data`).
- `PGPORT`: Port of the PostgreSQL server (e.g., `5432`).

An example `.env` file for local development (matching `docker-compose.yml`):

```env
# .env file in the ./backend directory
PORT=3001
AISSTREAM_API_KEY=YOUR_AISSTREAM_IO_API_KEY

# PGUSER=postgres
# PGPASSWORD=postgres
# PGDATABASE=ais_data
# PGPORT=5432
```

**Running the Backend**
- After you set up the environment variables, start the PostgreSQL database using Docker Compose:
  ```bash
  docker-compose up -d
  ```
- Then start the development server:
  ```bash
  npm run dev
  ```

### Endpoints

#### `GET /health`
- **Description:** Checks the health of the service, primarily verifying the database connection.
- **Response (Success - 200):**
  ```json
  {
    "status": "ok",
    "db_time": "2023-10-27T10:00:00.000Z"
  }
  ```
- **Response (Error - 503):**
  ```json
  {
    "status": "error",
    "error": "Database connection failed"
  }
  ```

#### `GET /api/vessels`
- **Description:** Retrieves a list of vessels within a specified geographical bounding box. Only vessels with data updated in the last 2 minutes are returned.
- **Query Parameters:**
  - `min-lon` (number, required): Minimum longitude of the bounding box.
  - `min-lat` (number, required): Minimum latitude of the bounding box (between -90 and 90).
  - `max-lon` (number, required): Maximum longitude of the bounding box.
  - `max-lat` (number, required): Maximum latitude of the bounding box (between -90 and 90).
- **Example Request:** `/api/vessels?min-lon=-10.5&min-lat=34.0&max-lon=-9.0&max-lat=35.5`
- **Response (Success - 200):**
  ```json
  [
    {
      "mmsi": 123456789,
      "lat": 34.5,
      "lon": -10.0,
      "course": 120.5,
      "name": "Example Vessel"
    },
    // ... other vessels
  ]
  ```
- **Response (Error - 500):**
  ```json
  {
    "status": "error",
    "error": "Internal Server Error"
  }
  ```

**Tech Stack:**
- Fastify
- TypeScript
- Docker
- PostgreSQL
- WebSockets


## Frontend Web

**Name:** `ais-viewer-web`

This is a web application built with Vite and TypeScript, designed to display AIS data on a map using MapLibre GL JS.

**Running the Web Frontend**
- Navigate to the `frontend-web` directory:
  ```bash
  cd frontend-web
  ```
- Install dependencies (if you haven't already):
  ```bash
  npm install
  ```
- Start the development server:
  ```bash
  npm run dev
  ```

**Tech Stack:**
-   Vite
-   TypeScript
-   MapLibre GL JS
-   React


## Frontend Mobile

**Name:** `ais-viewer-mobile`

This is a mobile application built with Expo (React Native) and TypeScript. It displays AIS data on a map using MapLibre GL Native.

**Running the Mobile Frontend**
- Navigate to the `frontend-mobile` directory:
  ```bash
  cd frontend-mobile
  ```
- Make sure your environment is set up correctly to run Expo apps: https://docs.expo.dev/get-started/set-up-your-environment
- To build and run the iOS version:
  ```bash
  npm ios
  ```
- To build and run the Android version:
  ```bash
  npm android
  ```

**Tech Stack:**
-   Expo / React Native
-   TypeScript
-   MapLibre GL Native