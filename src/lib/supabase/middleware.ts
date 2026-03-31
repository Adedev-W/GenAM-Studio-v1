import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If no user and trying to access protected routes, redirect to login
  const publicPaths = ['/login', '/register', '/forgot-password', '/auth', '/c/', '/api/c/', '/order/', '/api/order/'];
  const isPublic = request.nextUrl.pathname === '/' || publicPaths.some(p => request.nextUrl.pathname.startsWith(p));
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in and on landing/auth pages, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Business & onboarding redirect
  const skipChecks = ['/onboarding', '/pilih-bisnis', '/buat-bisnis', '/akun', '/settings', '/api/'];
  const needsCheck = user
    && !skipChecks.some(p => request.nextUrl.pathname.startsWith(p))
    && !isPublic;

  if (needsCheck) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_business_id')
        .eq('id', user.id)
        .single();

      if (!profile?.active_business_id) {
        // No active business — check if user has any businesses
        const { count: memberCount } = await supabase
          .from('business_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const url = request.nextUrl.clone();
        url.pathname = (memberCount ?? 0) > 0 ? '/pilih-bisnis' : '/onboarding';
        return NextResponse.redirect(url);
      }
    } catch {
      // Silently ignore check errors
    }
  }

  return supabaseResponse;
}
