import { loadEnvConfig } from "@next/env";
import path from "path";

// The .env file lives in the project root (one level up from this Next.js
// app). @next/env's dev-server-side loading only looks at this project's
// own directory, so load the parent explicitly wherever server code needs
// those variables (see next.config.ts for why that alone isn't enough).
loadEnvConfig(path.join(process.cwd(), ".."));
