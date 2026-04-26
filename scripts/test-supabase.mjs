import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Faltan envs");
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase.from("user_stats").select("*").limit(1);
if (error) {
  console.error("❌ ERROR:", error.message);
  process.exit(2);
}
console.log("✅ Supabase OK. Rows:", data?.length ?? 0);

const { data: profCheck, error: e2 } = await supabase
  .from("profiles")
  .select("id")
  .limit(1);
if (e2) console.error("⚠️ profiles read:", e2.message);
else console.log("✅ profiles table OK. Rows:", profCheck?.length ?? 0);
