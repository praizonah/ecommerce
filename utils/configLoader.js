import fs from 'fs';
import path from 'path';

// Robust loader for legacy `config.env` files. Parses key=value lines
// and sets process.env for any missing environment variables.
export function loadConfigEnvIfMissing(baseDir = process.cwd()) {
  try {
    const configPath = path.join(baseDir, 'config.env');
    if (!fs.existsSync(configPath)) return false;

    const raw = fs.readFileSync(configPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    let count = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      // Allow KEY = value (whitespace tolerant)
      const idx = line.indexOf('=');
      if (idx === -1) continue;

      let key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();

      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      // Only set if not already present in process.env
      if (key && typeof process.env[key] === 'undefined') {
        process.env[key] = val;
        count++;
      }
    }

    // Return true if we loaded any entries
    return count > 0;
  } catch (err) {
    // Don't crash the app if config parsing fails
    console.warn('configLoader: failed to read config.env:', err && err.message ? err.message : err);
    return false;
  }
}

export default loadConfigEnvIfMissing;
