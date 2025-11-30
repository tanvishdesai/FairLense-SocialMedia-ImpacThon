import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch the URL" },
                { status: 400 }
            );
        }

        const html = await response.text();
        console.log("Fetched HTML length:", html.length);
        const $ = cheerio.load(html);

        // Extract Open Graph tags
        const ogImage =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content");

        console.log("Extracted ogImage:", ogImage);

        const ogDescription =
            $('meta[property="og:description"]').attr("content") ||
            $('meta[name="description"]').attr("content") ||
            $('meta[name="twitter:description"]').attr("content") ||
            $('meta[property="og:title"]').attr("content"); // Fallback to title if description is missing

        console.log("Extracted ogDescription:", ogDescription);

        if (!ogImage) {
            console.log("Failed to find image. HTML snippet:", html.substring(0, 500));
            return NextResponse.json(
                { error: "Could not find an image on this page. The site might be blocking bots." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            imageUrl: ogImage,
            caption: ogDescription || "",
        });
    } catch (error) {
        console.error("Extraction Error:", error);
        return NextResponse.json(
            { error: "Failed to extract content" },
            { status: 500 }
        );
    }
}
