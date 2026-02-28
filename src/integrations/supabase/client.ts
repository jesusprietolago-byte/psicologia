import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://remnvakjvujygcdwnsgn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbW52YWtqdnVqeWdjZHduc2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMzE4MDcsImV4cCI6MjA4NzgwNzgwN30.VATN1TK-xkQC5mpvznUQHBbAMUJ9qISag3uF2bcopPI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);