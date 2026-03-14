/* =========================
SUPABASE INITIALIZATION
========================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://yurycodcwseqklcoecjk.supabase.co";
const SUPABASE_KEY = "sb_publishable_8hwtVoGYp-8aHOIKdObYXw_nDOnf7uE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);