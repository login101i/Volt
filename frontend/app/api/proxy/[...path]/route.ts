import { NextRequest, NextResponse } from 'next/server';

// Always use localhost for backend since it runs on the same machine
// The proxy allows ngrok-frontend to access localhost-backend
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    
    const backendUrl = `${BACKEND_URL}/api/${path}${queryString}`;
    
    const contentType = request.headers.get('content-type');
    const headers: HeadersInit = {};
    
    // Only set Content-Type if not multipart/form-data (fetch will set it with boundary)
    if (contentType && !contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    // Add body for POST, PUT requests
    if (method === 'POST' || method === 'PUT') {
      if (contentType?.includes('multipart/form-data')) {
        // For file uploads, use FormData directly
        const formData = await request.formData();
        options.body = formData;
        // Don't set Content-Type - fetch will set it with boundary automatically
      } else {
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      }
    }
    
    const response = await fetch(backendUrl, options);
    const data = await response.text();
    
    // Try to parse as JSON, fallback to text
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }
    
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}










