import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");
  const cookieStore = await cookies();

  if (oauthError) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(oauthError)}`, requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=Missing%20OAuth%20authorization%20code", requestUrl.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL("/?auth_error=Supabase%20environment%20variables%20are%20missing", requestUrl.origin));
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  // If user arrived from a project invite link, redirect back to the board invite
  const pendingInvite = cookieStore.get("bf_pending_invite")?.value;
  if (pendingInvite) {
    const targetUrl = new URL(`/kanban?invite=${encodeURIComponent(pendingInvite)}`, requestUrl.origin);
    const response = NextResponse.redirect(targetUrl);
    response.cookies.delete("bf_pending_invite");
    return response;
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
