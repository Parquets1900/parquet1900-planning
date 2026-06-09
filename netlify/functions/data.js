const { getStore } = require("@netlify/blobs");

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
};

exports.handler = async function(event, context) {
    // Preflight CORS
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    const store = getStore({ name: "planning", consistency: "strong" });

    // GET → devolver datos guardados
    if (event.httpMethod === "GET") {
        try {
            const data = await store.get("plandata", { type: "json" });
            return { statusCode: 200, headers, body: JSON.stringify(data || null) };
        } catch (e) {
            return { statusCode: 200, headers, body: "null" };
        }
    }

    // POST → guardar datos nuevos
    if (event.httpMethod === "POST") {
        try {
            const body = JSON.parse(event.body);
            await store.set("plandata", JSON.stringify(body));
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        } catch (e) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
        }
    }

    return { statusCode: 405, headers, body: "Method not allowed" };
};
