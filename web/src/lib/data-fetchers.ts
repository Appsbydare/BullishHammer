// Fetch FX rates (CurrencyFreaks)
// The free tier allows 1,000 requests/month (approx 32/day, so fetch once every ~hour)
export async function getFXRates() {
  const apiKey = process.env.CURRENCYFREAKS_API_KEY?.trim();
  if (!apiKey) {
    console.warn("No CURRENCYFREAKS_API_KEY found, using placeholder FX data.");
    return {
      EUR: "1.0850",
      GBP: "1.2640",
      JPY: "155.20",
      AUD: "0.6540",
      CAD: "1.3700"
    };
  }

  try {
    const res = await fetch(`https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${apiKey}&symbols=EUR,GBP,JPY,AUD,CAD`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) throw new Error("Failed to fetch FX rates");
    const data = await res.json();
    return data.rates; // Returns object like { EUR: "1.0850", ... }
  } catch (error) {
    console.error("Error fetching FX rates:", error);
    return null;
  }
}

// Fetch financial news (Marketaux)
// The free tier allows 100 requests/day (fetch once every ~15 minutes)
export async function getMarketNews() {
  const apiKey = process.env.MARKETAUX_API_TOKEN?.trim();
  if (!apiKey) {
    console.warn("No MARKETAUX_API_TOKEN found, using placeholder news data.");
    return [
      {
        uuid: "1",
        title: "Global Markets Rally on Rate Cut Hopes",
        snippet: "Equities surged across the board as investors anticipate a more dovish stance from central banks in the coming months.",
        url: "#",
        source: "MarketWatch",
        published_at: new Date().toISOString()
      },
      {
        uuid: "2",
        title: "Oil Prices Stabilize After Week of Volatility",
        snippet: "Crude oil benchmarks leveled out today following supply chain disruptions and geopolitical tensions in the Middle East.",
        url: "#",
        source: "Reuters",
        published_at: new Date().toISOString()
      },
      {
        uuid: "3",
        title: "Tech Sector Leads Gains in Morning Trading",
        snippet: "Major tech stocks pushed higher at the open, shrugging off concerns about valuation and regulatory scrutiny.",
        url: "#",
        source: "Bloomberg",
        published_at: new Date().toISOString()
      }
    ];
  }

  try {
    const res = await fetch(`https://api.marketaux.com/v1/news/all?api_token=${apiKey}&language=en&limit=3`, {
      next: { revalidate: 900 } // Cache for 15 minutes
    });
    if (!res.ok) throw new Error("Failed to fetch market news");
    const data = await res.json();
    return data.data; // Array of news articles
  } catch (error) {
    console.error("Error fetching market news:", error);
    return [];
  }
}
