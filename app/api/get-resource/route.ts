import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skillName = searchParams.get('skillName');

  if (!skillName) {
    return NextResponse.json({ error: 'skillName is required' }, { status: 400 });
  }

  try {
    const firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });

    // Create a targeted search query for high quality tech tutorials
    const searchQuery = `${skillName} absolute beginner tutorial (site:geeksforgeeks.org OR site:freecodecamp.org OR site:python.org OR site:coursera.org OR site:kaggle.com)`;
    
    // Perform a web search using Firecrawl
    const result = await firecrawl.search(searchQuery, {
      limit: 3,
    });

    if (result.success && result.data && result.data.length > 0) {
      // Return the best URL
      const bestResult = result.data.find(r => 
        r.url && (
          r.url.includes('geeksforgeeks.org') || 
          r.url.includes('freecodecamp.org') || 
          r.url.includes('kaggle.com') ||
          r.url.includes('coursera.org') ||
          r.url.includes('developer.mozilla.org')
        )
      ) || result.data[0];

      return NextResponse.json({ url: bestResult.url });
    } else {
      // Fallback
      return NextResponse.json({ url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial for beginners')}` });
    }
  } catch (error) {
    console.error('Firecrawl Error:', error);
    return NextResponse.json({ 
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial for beginners')}` 
    });
  }
}
