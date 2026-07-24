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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isEnvMissing = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseUrl.includes('dummy');

  if (isEnvMissing) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        "\n🚨🚨🚨 [DEV ONLY] Middleware auth check BYPASSED — Supabase env vars missing/placeholder. This must NEVER happen in production. 🚨🚨🚨\n"
      );
      return response;
    } else {
      // Fail closed in production for protected routes
      if (path !== '/login' && path !== '/test' && path !== '/config-error') {
        return NextResponse.redirect(new URL('/config-error', request.url));
      }
      return response;
    }
  }

  try {
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
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

    // 1. Allow unauthenticated requests only for /login, /test, and /config-error
    if (!user) {
      if (path !== '/login' && path !== '/test' && path !== '/config-error') {
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

    // Enforce boundary redirect checks: non-owners cannot access Owner routes
    if (role !== 'owner' && isOwnerRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    console.error('Middleware execution failed:', error);
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
