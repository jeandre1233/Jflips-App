
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqededyngktjinztacrx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZWRlZHluZ2t0amluenRhY3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTI2MjMsImV4cCI6MjA4NTY4ODYyM30.SmeNobI4kPBeVB-jnoq4hZe2MKvSLRGG-h3oxYHp-WU';

export const supabase = createClient(supabaseUrl, supabaseKey);