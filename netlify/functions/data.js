const { getStore } = require("@netlify/blobs");

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
};

exports.handler = async function(event, context) {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    try {
        const store = getStore({ name: "planning", consistency: "strong" });

        if (event.httpMethod === "GET") {
            const data = await store.get("plandata", { type: "json" });
            return { statusCode: 200, headers, body: JSON.stringify(data || null) };
        }

        if (event.httpMethod === "POST") {
            const body = JSON.parse(event.body);
            await store.set("plandata", JSON.stringify(body));
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message, type: e.constructor.name }) };
    }

    return { statusCode: 405, headers, body: "Method not allowed" };
};
