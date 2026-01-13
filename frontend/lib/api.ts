// API configuration
// Detect if we're running on ngrok and get the backend URL accordingly
function getApiBaseUrl(): string {
  // Check if NEXT_PUBLIC_API_URL is explicitly set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In browser, check if we're on ngrok
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessed via ngrok, use relative URLs (Next.js will proxy)
    if (hostname.includes('.ngrok.io') || hostname.includes('.ngrok-free.app')) {
      // Use relative URL - Next.js API route will proxy to backend
      return '';
    }
  }
  
  // Default to localhost
  return 'http://localhost:5000';
}

const API_BASE_URL = getApiBaseUrl();

export const api = {
  baseURL: API_BASE_URL,
  
  // Helper function to make API calls
  async fetch(endpoint: string, options?: RequestInit) {
    // If API_BASE_URL is empty (ngrok mode), use Next.js API proxy route
    const url = API_BASE_URL 
      ? `${API_BASE_URL}${endpoint}`
      : `/api/proxy${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Failed to connect to server at ${url}. Make sure the server is running.`);
      }
      throw error;
    }
  },

  // Orders API
  orders: {
    getAll: () => api.fetch('/api/orders'),
    getById: (id: number | string) => api.fetch(`/api/orders/${id}`),
  },

  // Offers API
  offers: {
    create: (data: any) => api.fetch('/api/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAll: () => api.fetch('/api/offers'),
    getById: (id: number | string) => api.fetch(`/api/offers/${id}`),
    update: (id: number | string, data: any) => api.fetch(`/api/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number | string) => api.fetch(`/api/offers/${id}`, {
      method: 'DELETE',
    }),
  },

  // Upload API
  upload: {
    componentImage: async (componentId: string, file: File) => {
      try {
        // Step 1: Get signed URL from S3
        const signedUrlResponse = await fetch(`/api/media?fileType=${encodeURIComponent(file.type)}`);
        
        if (!signedUrlResponse.ok) {
          const errorData = await signedUrlResponse.json().catch(() => ({}));
          throw new Error(`Failed to get upload URL: ${signedUrlResponse.status} ${signedUrlResponse.statusText} - ${errorData.error || 'Unknown error'}`);
        }

        const { uploadUrl, key, url } = await signedUrlResponse.json();

        // Step 2: Upload file directly to S3 using signed URL
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        // Step 3: Return the S3 URL from the API response
        return {
          success: true,
          filePath: url, // Full S3 URL for accessing the uploaded file
          key: key,
        };
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error(`Failed to upload image. Make sure the server is running.`);
        }
        throw error;
      }
    },
  },
};

export default api;

