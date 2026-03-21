import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyToken } from "../_shared/auth.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const auth = await verifyToken(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const trackId = segments[segments.length - 1];

  if (!trackId || !UUID_RE.test(trackId)) {
    return new Response(JSON.stringify({ error: "Invalid track ID" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: track, error } = await supabase
    .from("tracks")
    .select("filename, flagged")
    .eq("id", trackId)
    .single();

  if (error || !track) {
    return new Response(JSON.stringify({ error: "Track not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (track.flagged) {
    return new Response(JSON.stringify({ error: "Track unavailable" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generate signed R2 URL
  const r2 = new AwsClient({
    accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
    region: "auto",
    service: "s3",
  });

  const bucket = Deno.env.get("R2_BUCKET_NAME")!;
  const endpoint = Deno.env.get("R2_PUBLIC_ENDPOINT")!;
  const encodedFilename = encodeURIComponent(track.filename);
  const objectUrl = `${endpoint}/${bucket}/${encodedFilename}?X-Amz-Expires=3600`;

  const signed = await r2.sign(
    new Request(objectUrl, { method: "GET" }),
    {
      aws: { signQuery: true },
    },
  );

  // Log play event (fire-and-forget)
  supabase
    .from("play_events")
    .insert({ track_id: trackId, user_id: auth.userId })
    .then(() => {});

  return new Response(
    JSON.stringify({ url: signed.url.toString() }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
