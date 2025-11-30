// const fetch = require('node-fetch'); // Native fetch is available in Node 18+
const cheerio = require('cheerio');

async function testTwitter(url) {
    console.log(`Testing URL: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
            return;
        }

        const html = await response.text();
        console.log(`Fetched HTML length: ${html.length}`);
        // console.log('HTML Snippet:', html.substring(0, 500));
        const $ = cheerio.load(html);

        const ogImage = $('meta[property="og:image"]').attr("content");
        const ogDescription = $('meta[property="og:description"]').attr("content");

        console.log('og:image:', ogImage);
        console.log('og:description:', ogDescription);
    } catch (error) {
        console.error('Error:', error);
    }
}

testTwitter('https://fxtwitter.com/jack/status/20');
