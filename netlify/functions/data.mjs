import { getStore } from "@netlify/blobs";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
};

function isAuthenticated(context) {
    // Netlify Identity popula context.clientContext.user si el JWT es válido
    return !!(context.clientContext && context.clientContext.user);
}

export default async (req, context) => {
    if (req.method === "OPTIONS") {
        return new Response("", { status: 200, headers });
    }

    if (!isAuthenticated(context)) {
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
