import { createClient } from "@supabase/supabase-js";

// Client serveur uniquement — utilise la clé secrète (jamais exposée au navigateur)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export type Profile = {
  id?: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
  plan?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
};
