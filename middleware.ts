import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without authentication
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow access to public pages
        if (req.nextUrl.pathname === '/') {
          return true
        }
        
        // Allow access to API routes that don't require auth
        if (req.nextUrl.pathname.startsWith('/api/session') ||
            req.nextUrl.pathname.startsWith('/api/chat') ||
            req.nextUrl.pathname.startsWith('/api/profile') ||
            req.nextUrl.pathname.startsWith('/api/chatbot') ||
            req.nextUrl.pathname.startsWith('/api/property') ||
            req.nextUrl.pathname.startsWith('/api/mls')) {
          return true
        }
        
        // Require authentication for dashboard and protected API routes
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/api/dashboard') ||
            req.nextUrl.pathname.startsWith('/api/realtor') ||
            req.nextUrl.pathname.startsWith('/api/stripe') ||
            req.nextUrl.pathname.startsWith('/api/admin') ||
            req.nextUrl.pathname.startsWith('/admin')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/dashboard/:path*',
    '/api/realtor/:path*',
    '/api/stripe/:path*',
    '/api/admin/:path*'
  ]
}
