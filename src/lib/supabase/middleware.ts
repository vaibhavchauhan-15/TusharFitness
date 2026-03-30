import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isActiveAdminUser } from "@/lib/admin/access";
import { env, isSupabaseConfigured } from "@/lib/env";
import {
  isRefreshTokenNotFoundError,
  isSupabaseAuthCookieName,
} from "@/lib/supabase/auth-utils";

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (isSupabaseAuthCookieName(name)) {
      request.cookies.delete(name);
      response.cookies.delete(name);
    }
  });
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!isSupabaseConfigured) {
    return { response, user: null, isAdmin: false };
  }

  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isRefreshTokenNotFoundError(error)) {
        clearSupabaseAuthCookies(request, response);
      }

      return { response, user: null, isAdmin: false };
    }

    let isAdmin = false;
    const shouldResolveAdminStatus =
      request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";

    if (shouldResolveAdminStatus && user) {
      isAdmin = await isActiveAdminUser(supabase, user.id);
    }

    return { response, user, isAdmin };
  } catch (error) {
    if (isRefreshTokenNotFoundError(error)) {
      clearSupabaseAuthCookies(request, response);
      return { response, user: null, isAdmin: false };
    }

    throw error;
  }
}
