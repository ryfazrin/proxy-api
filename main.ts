import { serve } from "https://deno.land/std/http/server.ts";

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  // Menambahkan header CORS untuk mengizinkan permintaan dari domain tertentu
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*"); // Mengizinkan permintaan dari localhost:3000
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Izinkan metode yang dibutuhkan
  headers.set("Access-Control-Allow-Headers", "Content-Type"); // Izinkan header yang dibutuhkan

  // CORS preflight request (OPTIONS request)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (!targetUrl) {
    return new Response("URL parameter is missing", { status: 400 });
  }

  try {
    // Mengambil HTML dari URL yang diberikan
    const response = await fetch(decodeURIComponent(targetUrl));

    // Jika respon berhasil, kembalikan HTML ke klien
    if (response.ok) {
      const html = await response.text();
      return new Response(html, {
        headers: {
          ...headers, // Menambahkan header CORS ke respons
          "Content-Type": "text/html",
        },
      });
    } else {
      return new Response("Failed to fetch content", { status: 500, headers });
    }
  } catch (error) {
    console.error(error);
    return new Response("Error fetching the content", { status: 500, headers });
  }
};

serve(handler, { port: 5000 });
