import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config/env";
import { ROLE_DASHBOARD } from "@/lib/config/roles";

const AUTH_PAGES = ["/login", "/register", "/forgot-password"];
const ADMIN_AUTH_PAGES = ["/admin/login"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  if (!isSupabaseConfigured) {
    if (path.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "?error=not_configured";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() revalidates the token with Supabase Auth; never trust getSession() on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && path.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = profile?.role as keyof typeof ROLE_DASHBOARD | undefined;

    if (ADMIN_AUTH_PAGES.includes(path)) {
      const url = request.nextUrl.clone();
      url.pathname = role === "administrator" ? "/dashboard/admin" : (role ? ROLE_DASHBOARD[role] : "/dashboard");
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (AUTH_PAGES.includes(path)) {
      const url = request.nextUrl.clone();
      url.pathname = role ? ROLE_DASHBOARD[role] : "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
