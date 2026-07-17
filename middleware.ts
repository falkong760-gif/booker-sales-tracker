import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = 'https://hpmmawocfwealisbhutj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2Oy3GzOINC6MwOyaBPhrzg_X4HCuAgU';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Bypass Next.js internal resources and static assets
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/icons/') ||
    path.startsWith('/manifest.webmanifest') ||
    path.includes('.')
  ) {
    return response;
  }

  // 1. Locate the Supabase Auth Cookie
  const allCookies = request.cookies.getAll();
  const supabaseCookie = allCookies.find(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  if (supabaseCookie) {
    try {
      const parsed = JSON.parse(supabaseCookie.value);
      if (Array.isArray(parsed)) {
        accessToken = parsed[0];
        refreshToken = parsed[1];
      } else if (parsed && typeof parsed === 'object') {
        accessToken = parsed.access_token || null;
        refreshToken = parsed.refresh_token || null;
      }
    } catch {
      // Cookie is not valid JSON
    }
  }

  let user: { id: string; email: string } | null = null;

  // 2. If access token exists, verify with Supabase Auth API
  if (accessToken) {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (userRes.ok) {
      const userData = await userRes.json();
      if (userData && userData.id) {
        user = {
          id: userData.id,
          email: userData.email || '',
        };
      }
    } else if (refreshToken) {
      // Token might be expired, try refreshing it
      const refreshRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData && refreshData.user && refreshData.access_token) {
          user = {
            id: refreshData.user.id,
            email: refreshData.user.email || '',
          };
          // Update the cookie in the response
          const newCookieValue = JSON.stringify([refreshData.access_token, refreshData.refresh_token]);
          response.cookies.set(supabaseCookie!.name, newCookieValue, {
            path: '/',
            maxAge: refreshData.expires_in || 3600,
          });
        }
      }
    }
  }

  // 3. Allow unauthenticated requests only for /login or /test
  if (!user) {
    if (path !== '/login' && path !== '/test') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // 4. Redirect logged-in users away from /login
  if (path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Fetch user role from public.users using REST endpoint to enforce route guards
  let role: 'owner' | 'booker' | null = null;
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}&select=role`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (profileRes.ok) {
    const profiles = await profileRes.json();
    if (Array.isArray(profiles) && profiles.length > 0) {
      role = profiles[0].role;
    }
  }

  if (!role) {
    return response;
  }

  // 6. Enforce boundaries
  const ownerRoutes = ['/bookers', '/comparison', '/reports'];
  const isOwnerRoute = ownerRoutes.some((route) => path.startsWith(route));

  const bookerRoutes = ['/entry', '/history', '/charts'];
  const isBookerRoute = bookerRoutes.some((route) => path.startsWith(route));

  if (role === 'booker' && isOwnerRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (role === 'owner' && isBookerRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons/ (PWA launcher icons)
     * - manifest.webmanifest (manifest)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
