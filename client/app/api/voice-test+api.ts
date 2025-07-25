// Simple test API to verify basic functionality
export async function POST(request: Request) {
  console.log('[voice-test API] Test API called');
  
  try {
    const body = await request.json();
    console.log('[voice-test API] Body received:', body);
    
    return Response.json({ 
      message: "Test API is working",
      receivedData: body 
    });
  } catch (error) {
    console.error('[voice-test API] Error:', error);
    return Response.json(
      { error: "Test API error: " + error.message },
      { status: 500 }
    );
  }
}