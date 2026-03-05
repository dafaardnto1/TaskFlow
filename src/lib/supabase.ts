import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://spykbiucnkqemsefjeig.supabase.co';
// PASTIKAN KEY INI ADALAH "ANON PUBLIC" DARI DASHBOARD SUPABASE
const supabaseKey = 'sb_publishable_hSZEgib5UK3cFj3BFxRoVg_zpONdah4'; 

export const supabase = createClient(supabaseUrl, supabaseKey);