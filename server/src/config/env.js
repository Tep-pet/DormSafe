import dotenv from 'dotenv';

dotenv.config();

// Local dev fix for "fetch failed" SSL errors on some Windows networks
if (process.env.SUPABASE_INSECURE_SSL === '1') {
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
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  googleMapsApiKey: (process.env.GOOGLE_MAPS_API_KEY || '').trim(),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
