export default async function handler(req, res) {
  return res.status(200).json({
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    HAS_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SERVICE_ROLE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    SERVICE_ROLE_KEY_PREFIX: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'none',
  });
}
