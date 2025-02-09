// index.ts
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const router = new Router();

router.all("/proxy-api", async (context) => {
  // Ambil parameter query "url"
  const targetUrlEncoded = context.request.url.searchParams.get("url");
  if (!targetUrlEncoded) {
    context.response.status = 400;
    context.response.body = "Parameter 'url' tidak ditemukan";
    return;
  }

  // Decode dan validasi URL target
  let targetUrl: URL;
  try {
    const decodedUrl = decodeURIComponent(targetUrlEncoded);
    targetUrl = new URL(decodedUrl);
  } catch (error) {
    context.response.status = 400;
    context.response.body = "URL target tidak valid";
    return;
  }

  // Jika ada query string pada request proxy, lampirkan ke URL target
  targetUrl.search = context.request.url.search;

  // Salin header dari request masuk, kecuali header "host"
  const reqHeaders = new Headers();
  for (const [key, value] of context.request.headers.entries()) {
    if (key.toLowerCase() !== "host") {
      reqHeaders.set(key, value);
    }
  }

  // Siapkan opsi fetch untuk meneruskan request ke URL target
  const requestInit: RequestInit = {
    method: context.request.method,
    headers: reqHeaders,
  };

  // Sertakan body jika ada
  if (context.request.hasBody) {
    const body = context.request.body({ type: "stream" });
    requestInit.body = body.value;
  }

  // Lakukan fetch ke URL target
  const response = await fetch(targetUrl.toString(), requestInit);

  // Set status respons sesuai dengan respons dari target
  context.response.status = response.status;

  // Salin header dari respons target kecuali header 'Access-Control-Allow-Origin'
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === "access-control-allow-origin") {
      continue;
    }
    context.response.headers.set(key, value);
  }

  // Set header CORS yang diinginkan, misalnya menjadi '*'
  context.response.headers.set("Access-Control-Allow-Origin", "*");

  // Set respons body sebagai stream body dari fetch
  context.response.body = response.body;
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Reverse proxy berjalan di http://localhost:5000");
await app.listen({ port: 5000 });
