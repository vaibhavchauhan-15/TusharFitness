export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseDbUrl: process.env.SUPABASE_DB_URL,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayCheckoutConfigId: process.env.RAZORPAY_CHECKOUT_CONFIG_ID,
};

export const isSupabaseConfigured =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const isSupabaseAdminConfigured =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseServiceRoleKey);

export const isGroqConfigured = Boolean(env.groqApiKey);

export const isRazorpayConfigured =
  Boolean(env.razorpayKeyId) && Boolean(env.razorpayKeySecret);
