// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// src/app.d.ts

import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { Database } from 'types/supabase';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
    }
    interface PageData {
      session: Session | null;
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};
