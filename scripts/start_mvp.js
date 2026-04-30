const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

if (!process.env.IOE_PG_URL) {
  console.error('IOE_PG_URL ontbreekt. Maak een .env.local in de repo-root op basis van .env.example.');
  console.error('Voorbeeld: IOE_PG_URL=postgresql://ioe_app:<password>@localhost:5432/ikoverleef_dev');
  process.exit(1);
}

const { startServer } = require('../apps/internal-poc/server');

startServer();
