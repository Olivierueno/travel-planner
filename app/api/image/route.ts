import { NextRequest, NextResponse } from 'next/server';

async function findImageUrl(query: string): Promise<string | null> {
  try {
    // Try Wikipedia REST API first
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'TravelPlanner/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.originalimage?.source) {
        return data.originalimage.source;
      }
      if (data.thumbnail?.source) {
        return data.thumbnail.source.replace(/\/\d+px-/, '/640px-');
      }
    }

    // Fallback: Wikipedia pageimages API
    const fallbackRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=800&origin=*`,
      { headers: { 'User-Agent': 'TravelPlanner/1.0' } }
    );
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      const pages = data.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
        if (page?.thumbnail?.source) return page.thumbnail.source.replace(/\/\d+px-/, '/640px-');
      }
    }
  } catch {}
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return new NextResponse(null, { status: 404 });
  }

  const imageUrl = await findImageUrl(q);
  if (!imageUrl) {
    return new NextResponse(null, { status: 404 });
  }

  // Proxy the image through our server
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'TravelPlanner/1.0' },
    });
    if (!imgRes.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
