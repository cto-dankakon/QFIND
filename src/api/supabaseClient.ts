// Client Supabase partagé pour tout le projet QFind
// Importer `supabase` depuis ce fichier dans tous les modules qui font des appels DB

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eybvjylqsiyvycaqkcqb.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YnZqeWxxc2l5dnljYXFrY3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzYyNzcsImV4cCI6MjA5MTYxMjI3N30.XJcui-olc1qrDMjBGYo4dixILqqtm_U7C0ZufxDUz00';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
