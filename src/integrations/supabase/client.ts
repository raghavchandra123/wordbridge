import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://biyfjdvneaycbhwodeaw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeWZqZHZuZWF5Y2Jod29kZWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MjIyMTgsImV4cCI6MjA0NjM5ODIxOH0.9cOIO0N02eji4hISFYmSXezer4CrsUMC90XzZ58lBzw";

const originalClient = createClient<Database>(supabaseUrl, supabaseKey);

const getCallerInfo = () => {
  const stack = new Error().stack;
  if (!stack) return { location: 'Unknown location', component: 'Unknown component' };
  
  const lines = stack.split('\n');
  
  // Find the first line that's not from this file or node_modules
  const relevantLine = lines.find(line => 
    !line.includes('client.ts') && 
    !line.includes('node_modules') &&
    line.includes('src/')
  );
  
  if (!relevantLine) return { location: 'Unknown location', component: 'Unknown component' };
  
  // Extract file path and line number
  const match = relevantLine.match(/src\/(.+?):\d+/);
  const location = match ? match[1] : 'Unknown location';
  
  // Try to extract component name
  const componentMatch = location.match(/components\/([^/]+)/);
  const component = componentMatch ? componentMatch[1] : 'Unknown component';
  
  return { location, component };
};

// Create a Set to track unique query signatures
const recentQueries = new Set<string>();
const QUERY_TRACKING_WINDOW = 1000; // 1 second window

// Helper to create a unique query signature
const createQuerySignature = (operation: string, args: any[], location: string) => {
  return `${operation}-${JSON.stringify(args)}-${location}`;
};

// Wrap the Supabase client to add detailed logging
export const supabase = new Proxy(originalClient, {
  get(target, property) {
    if (typeof target[property] === 'function') {
      return new Proxy(target[property], {
        apply: (target, thisArg, argumentsList) => {
          const { location, component } = getCallerInfo();
          const querySignature = createQuerySignature(String(property), argumentsList, location);

          // Check if this exact query was made recently
          if (recentQueries.has(querySignature)) {
            console.warn('🚨 Duplicate Query Detected:', {
              timestamp: new Date().toISOString(),
              operation: String(property),
              arguments: argumentsList,
              component,
              location,
              message: 'This exact query was made within the last second'
            });
          }

          // Add query to recent set and remove it after window
          recentQueries.add(querySignature);
          setTimeout(() => recentQueries.delete(querySignature), QUERY_TRACKING_WINDOW);

          // Log all queries with enhanced details
          console.log('🔍 Supabase Query Details:', {
            timestamp: new Date().toISOString(),
            operation: String(property),
            arguments: argumentsList,
            component,
            location,
            stackTrace: new Error().stack
          });

          return target.apply(thisArg, argumentsList);
        }
      });
    }
    return target[property];
  }
});