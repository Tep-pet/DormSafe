import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();
try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: join(currentDir, '../../.env') });
  }
} catch {
  // Safe fallback if path resolution fails
}


// Fix for "fetch failed" SSL errors across dev and cloud environments
if (process.env.SUPABASE_INSECURE_SSL === '1' || process.env.VERCEL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.warn(
    `DormSafe server: missing env vars: ${missing.join(', ')}. Copy server/.env.example to server/.env`
  );
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  supabaseUrl: process.env.SUPABASE_URL || 'https://myyvflahkvndetqmfqdr.supabase.co',
  supabaseServiceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eXZmbGFoa3ZuZGV0cW1mcWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjA4NTM2OSwiZXhwIjoyMTAxNjYxMzY5fQ.Av28HX4TlrYJ3K1_MnL0ItVrMvm_cFbsN3Uzhtr4Ffc',
  orsApiKey: (process.env.OPENROUTESERVICE_API_KEY || process.env.ORS_API_KEY || '').trim(),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
