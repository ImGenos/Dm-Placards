import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const placeId = url.searchParams.get("placeId");

  if (!placeId) {
    return new Response(JSON.stringify({ error: "Missing placeId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const fields = "name,rating,user_ratings_total,reviews,place_id";
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}&language=fr`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Google API HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google API error: ${data.status} - ${data.error_message || ""}`);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
