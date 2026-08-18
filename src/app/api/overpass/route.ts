import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query;

    if (!query) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    // Usar la API de Kumi Systems (francesa) que tiene menos bloqueos que la principal de Alemania
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    
    // Convertir a form-urlencoded
    const params = new URLSearchParams();
    params.append("data", query.trim());

    const response = await fetch(overpassUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Holyfind-App/1.0 (contact@holyfind.app)" // Overpass bloquea si no hay un User-Agent claro
      },
      body: params.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Overpass Server Error:", response.status, text);
      return NextResponse.json(
        { error: `Overpass API error: ${response.status}`, details: text }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("Internal Server Error in /api/overpass:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
