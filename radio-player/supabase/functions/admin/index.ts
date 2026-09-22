import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyToken } from "../_shared/auth.ts";

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  // Auth check
  const auth = await verifyToken(req);
  if (!auth || !auth.isAdmin) {
    return json({ error: "Forbidden" }, 403);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // URL: /admin/{resource}/{id?}
  // segments after the function name: resource, id
  const resource = segments[segments.length - 1] === "admin"
    ? url.searchParams.get("resource") || ""
    : segments[segments.length - 1] || "";

  // Support ?resource=xxx for simpler routing
  const resourceName = url.searchParams.get("resource") || resource;
  const resourceId = url.searchParams.get("id") || null;

  const TABLES: Record<string, string> = {
    tracks: "tracks",
    users: "users",
    play_events: "play_events",
    reports: "reports",
  };

  const table = TABLES[resourceName];
  if (!table) {
    return json({ error: "Unknown resource", valid: Object.keys(TABLES) }, 400);
  }

  try {
    switch (req.method) {
      case "GET": {
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const orderBy = url.searchParams.get("order_by") || "created_at";
        const orderDir = url.searchParams.get("order_dir") === "asc";

        let query = supabase
          .from(table)
          .select("*", { count: "exact" })
          .order(orderBy, { ascending: orderDir })
          .range(offset, offset + limit - 1);

        // Filtering support
        const filterCol = url.searchParams.get("filter_col");
        const filterVal = url.searchParams.get("filter_val");
        if (filterCol && filterVal !== null) {
          query = query.eq(filterCol, filterVal);
        }

        const { data, error, count } = await query;
        if (error) return json({ error: error.message }, 500);
        return json({ data, count });
      }

      case "PUT": {
        if (!resourceId) return json({ error: "Missing id" }, 400);
        const body = await req.json();
        const { data, error } = await supabase
          .from(table)
          .update(body)
          .eq("id", resourceId)
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ data });
      }

      case "POST": {
        const body = await req.json();
        const { data, error } = await supabase
          .from(table)
          .insert(body)
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ data }, 201);
      }

      case "DELETE": {
        if (!resourceId) return json({ error: "Missing id" }, 400);
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", resourceId);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      default:
        return json({ error: "Method not allowed" }, 405);
    }
  } catch (err) {
    return json({ error: (err as Error).message || "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
