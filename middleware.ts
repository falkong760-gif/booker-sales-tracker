import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from './types/database.types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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

  // Create the official @supabase/ssr server client directly in middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Allow unauthenticated requests only for /login or /test (marked for deletion before Phase 7)
  if (!user) {
    if (path !== '/login' && path !== '/test') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // 2. Redirect logged-in users away from /login
  if (path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Fetch user role to enforce route guards
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return response;
  }

  const role = profile.role;

  // 4. Owner route list
  const ownerRoutes = ['/bookers', '/comparison', '/reports'];
  const isOwnerRoute = ownerRoutes.some((route) => path.startsWith(route));

  // 5. Booker route list
  const bookerRoutes = ['/entry', '/history', '/charts'];
  const isBookerRoute = bookerRoutes.some((route) => path.startsWith(route));

  // Enforce boundary redirect checks
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
