async function test() {
  const imagePromptText = `Cinematic premium editorial financial news cover image for article: "test". Professional photography, dark dramatic lighting, financial markets, 4K quality.`;
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePromptText)}?width=1280&height=720&model=sana&nologo=true&enhance=true&seed=${Date.now()}`;
  
  console.log('Fetching:', pollinationsUrl);
  try {
    const imgRes = await fetch(pollinationsUrl, { signal: AbortSignal.timeout(45000) });
    console.log('ok:', imgRes.ok, 'status:', imgRes.status);
    if(imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        console.log('buffer length:', arrayBuffer.byteLength);
    } else {
        console.log(await imgRes.text());
    }
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
