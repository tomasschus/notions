import { execSync } from "child_process";
import path from "path";

async function globalSetup() {
  const root = path.join(__dirname, "..");
  try {
    execSync("npx prisma db push", {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "postgresql://notions:notions@localhost:5432/notions" },
    });
  } catch {
    console.warn("db push failed (is PostgreSQL running? docker-compose up -d db)");
  }
  try {
    execSync("npx prisma db seed", {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "postgresql://notions:notions@localhost:5432/notions" },
    });
  } catch {
    console.warn("db seed failed");
  }
}

export default globalSetup;
