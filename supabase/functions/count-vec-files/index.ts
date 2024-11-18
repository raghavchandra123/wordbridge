import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { walk } from 'https://deno.land/std@0.168.0/fs/walk.ts'

serve(async (req) => {
  try {
    let count = 0;
    let totalSize = 0;
    
    // Walk through the public/data/words directory
    const wordsDir = './public/data/words';
    for await (const entry of walk(wordsDir)) {
      if (entry.isFile && entry.name.endsWith('.vec')) {
        count++;
        const fileInfo = await Deno.stat(entry.path);
        totalSize += fileInfo.size;
      }
    }
    
    return new Response(
      JSON.stringify({ count, size: totalSize }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})