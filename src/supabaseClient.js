import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kibgskyyevsighwtkqcf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpYmdza3l5ZXZzaWdod3RrcWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjQ1NTIsImV4cCI6MjA3NDIwMDU1Mn0.Dycsj4pdlbz6PFctjQOjZpR29illLV68Ylim7Sb3kv4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);