import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://biyfjdvneaycbhwodeaw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeWZqZHZuZWF5Y2Jod29kZWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MjIyMTgsImV4cCI6MjA0NjM5ODIxOH0.9cOIO0N02eji4hISFYmSXezer4CrsUMC90XzZ58lBzw";

const originalClient = createClient<Database>(supabaseUrl, supabaseKey);

const getCallerInfo = () => {
  const stack = new Error().stack;
  if (!stack) return 'Unknown location';
  
  // Split the stack trace into lines
  const lines = stack.split('\n');
  
  // Find the first line that's not from this file or node_modules
  const relevantLine = lines.find(line => 
    !line.includes('client.ts') && 
    !line.includes('node_modules') &&
    line.includes('src/')
  );
  
  if (!relevantLine) return 'Unknown location';
  
  // Extract file path and line number
  const match = relevantLine.match(/src\/(.+?):\d+/);
  return match ? match[1] : 'Unknown location';
};

// Wrap the Supabase client to add detailed logging
export const supabase = new Proxy(originalClient, {
  get(target, property) {
    if (typeof target[property] === 'function') {
      return new Proxy(target[property], {
        apply: (target, thisArg, argumentsList) => {
          const callerInfo = getCallerInfo();
          console.log('🔍 Supabase Query Details:', {
            timestamp: new Date().toISOString(),
            operation: String(property),
            arguments: argumentsList,
            callerLocation: callerInfo,
            stackTrace: new Error().stack
          });
          return target.apply(thisArg, argumentsList);
        }
      });
    }
    return target[property];
  }
});