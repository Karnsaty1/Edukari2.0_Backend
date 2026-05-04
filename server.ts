import dotenv from "dotenv";
import http from "node:http";
import { connectDB } from "./src/config/db";
import { createApp } from "./src/app";
import { initLiveSockets } from "./src/modules/live/live.socket";

dotenv.config();

async function startServer(): Promise<void> {
  try {
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);
    initLiveSockets(server);

    const port = process.env.PORT || 5000;

    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
