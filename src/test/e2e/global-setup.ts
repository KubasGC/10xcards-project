import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function globalSetup() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL must be set in .env.test");
  }

  if (!supabaseServiceKey && !supabaseAnonKey) {
    throw new Error("Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY must be set in .env.test");
  }

  console.log("🔄 Setting up test database...");

  let supabase;
  let usingServiceRole = false;

  if (supabaseServiceKey) {
    // Use service role key which bypasses RLS
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    usingServiceRole = true;
    console.log("Using service role key for admin operations");
  } else if (supabaseAnonKey) {
    // Use anon key - limited by RLS policies
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("Using anon key - operations limited by RLS policies");
  }

  try {
    // Tables to truncate in reverse dependency order (child tables first)
    const tablesToTruncate = ["ai_generation_analytics", "pending_flashcards", "flashcards", "sets"];

    console.log("🗑️  Truncating tables...");

    for (const tableName of tablesToTruncate) {
      console.log(`  - Truncating ${tableName}...`);

      if (usingServiceRole) {
        // With service role, we can delete all records
        const { error } = await supabase
          .from(tableName)
          .delete()
          .neq("created_at", new Date("2055-01-01").toISOString());

        if (error) {
          console.warn(`⚠️  Could not truncate ${tableName}:`, error.message);
        } else {
          console.log(`  ✅ ${tableName} truncated successfully`);
        }
      } else {
        // With anon key, we can only delete records owned by the current user
        // Since we're not authenticated, this won't work
        console.warn(`⚠️  Cannot truncate ${tableName} with anon key due to RLS policies`);
        console.warn(`   To fully truncate tables, add SUPABASE_SERVICE_ROLE_KEY to .env.test`);
        console.warn(`   Or truncate tables manually before running tests`);
      }
    }

    if (!usingServiceRole) {
      console.log("⚠️  Setup completed with limitations - some data may remain in tables");
      console.log("   For full cleanup, add SUPABASE_SERVICE_ROLE_KEY to .env.test");
    } else {
      console.log("✅ Test database setup completed successfully");
    }
  } catch (error) {
    console.error("❌ Failed to setup test database:", error);
    throw error;
  }
}

export default globalSetup;
