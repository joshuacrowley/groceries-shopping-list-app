// NOTE: This API route is deprecated. AI calls now go through the
// Cloudflare Worker proxy at /api/gemini.

export async function POST(request: Request) {
  return Response.json({ 
    error: "This endpoint is deprecated. AI features now use the server-side proxy.",
    suggestedTemplates: []
  }, { status: 410 });
}
