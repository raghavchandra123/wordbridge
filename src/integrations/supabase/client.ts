import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { logDatabaseOperation } from '@/lib/utils/dbLogger';

const supabaseUrl = "https://biyfjdvneaycbhwodeaw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeWZqZHZuZWF5Y2Jod29kZWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MjIyMTgsImV4cCI6MjA0NjM5ODIxOH0.9cOIO0N02eji4hISFYmSXezer4CrsUMC90XzZ58lBzw";

const originalClient = createClient<Database>(supabaseUrl, supabaseKey);

// Wrap the Supabase client to add logging
export const supabase = new Proxy(originalClient, {
  get(target, property) {
    if (typeof target[property] === 'function') {
      return new Proxy(target[property], {
        apply: (target, thisArg, argumentsList) => {
          logDatabaseOperation(`Supabase ${String(property)} called`, {
            arguments: argumentsList.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : arg
            )
          });
          return target.apply(thisArg, argumentsList);
        }
      });
    }
    return target[property];
  }
});