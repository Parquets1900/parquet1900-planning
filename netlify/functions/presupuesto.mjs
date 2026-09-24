import { getStore } from "@netlify/blobs";

const SITE_ID = "29cb2bbe-383b-4ae8-b54d-8aa9fbe293cb";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

function getPresStore() {
    return getStore({
        name: "presupuestos",
        siteID: SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
    });
}

export default async (req, context) => {
    if (req.method === "OPTIONS") {
        return new Response("", { status: 200, headers: corsHeaders });
    }

    const url = new URL(req.url);

    try {
        const store = getPresStore();

        // GET ?list=1  → all keys
        if (req.method === "GET" && url.searchParams.get("list") === "1") {
            const result = await store.list();
            const keys = result.blobs.map(b => b.key);
            return new Response(JSON.stringify(keys), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // GET ?prefix=PRSTO/2026/000261  → keys matching prefix
        if (req.method === "GET" && url.searchParams.get("prefix")) {
            const prefix = url.searchParams.get("prefix");
            const result = await store.list({ prefix });
            const keys = result.blobs.map(b => b.key);
            return new Response(JSON.stringify(keys), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // GET ?num=PRSTO/2026/000089  → PDF binary
        if (req.method === "GET") {
            const num = url.searchParams.get("num");
            if (!num) return new Response("Missing num", { status: 400, headers: corsHeaders });
            const buf = await store.get(num, { type: "arrayBuffer" });
            if (!buf) return new Response("Not found", { status: 404, headers: corsHeaders });
            return new Response(buf, {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/pdf" }
            });
        }

        // POST  body: { num, data: base64 }  → store PDF
        if (req.method === "POST") {
            const body = await req.json();
            const { num, data } = body;
            if (!num || !data) return new Response("Missing num or data", { status: 400, headers: corsHeaders });
            // decode base64 to binary
            const binary = Uint8Array.from(atob(data), c => c.charCodeAt(0));
            await store.set(num, binary, { metadata: { contentType: "application/pdf" } });
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // DELETE ?num=PRSTO/2026/000089
        if (req.method === "DELETE") {
            const num = url.searchParams.get("num");
            if (!num) return new Response("Missing num", { status: 400, headers: corsHeaders });
            await store.delete(num);
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
};

export const config = { path: "/api/presupuesto" };
