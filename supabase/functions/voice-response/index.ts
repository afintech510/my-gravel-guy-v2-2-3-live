
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve((_req: Request) => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
<Say voice="woman">Thank you for calling my gravel guy dot com. </Say>
<Pause length="1"/>
<Say voice="woman"> we are america's first A I powered gravel distribution network.</Say>
</Response>`;
  return new Response(xmlContent, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
});
