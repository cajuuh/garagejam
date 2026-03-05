import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfftdtppzjcfpehgnvil.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZnRkdHBwempjZnBlaGdudmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjYxNzEsImV4cCI6MjA4ODMwMjE3MX0.mPGYspBN0Mz1NTf2n6D5CFHkyr-wdMZU_OJJbXMfhS8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
