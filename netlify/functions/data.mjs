import { getStore } from "@netlify/blobs";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
};

function isAuthenticated(context, req) {
    // Método 1: context automático de Netlify Identity
    if (context.clientContext && context.clientContext.user) return true;
    // Método 2: verificar JWT del header manualmente
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return !!(payload.sub && payload.exp && payload.exp * 1000 > Date.now());
    } catch { return false; }
}

export default async (req, context) => {
    if (req.method === "OPTIONS") {
        return new Response("", { status: 200, headers });
    }

    if (!isAuthenticated(context, req)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    try {
        const store = getStore({
            name: "planning",
            siteID: "29cb2bbe-383b-4ae8-b54d-8aa9fbe293cb",
            token: process.env.NETLIFY_AUTH_TOKEN
        });

        if (req.method === "GET") {
            const data = await store.get("plandata", { type: "json" });
            return new Response(JSON.stringify(data || null), { status: 200, headers });
        }

        if (req.method === "POST") {
            const body = await req.json();
            await store.set("plandata", JSON.stringify(body));
            return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message, type: e.constructor.name }), { status: 500, headers });
    }

    return new Response("Method not allowed", { status: 405, headers });
};

export const config = { path: "/api/data" };
