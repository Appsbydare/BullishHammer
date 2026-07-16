import { getCliClient } from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-15'})

async function seed() {
  console.log('Seeding data...')
  
  const author = await client.create({
    _type: 'author',
    name: 'Sahi Demon',
    bio: 'Lead Market Analyst'
  })
  console.log('Created author:', author._id)

  const category = await client.create({
    _type: 'category',
    title: 'Market Updates',
    slug: { _type: 'slug', current: 'market-updates' }
  })
  console.log('Created category:', category._id)

  const article1 = await client.create({
    _type: 'article',
    title: 'EUR/USD Touches Monthly High Amid Fed Speculation',
    slug: { _type: 'slug', current: 'eur-usd-touches-monthly-high' },
    excerpt: 'The Euro strengthens as markets price in upcoming rate cuts from the Federal Reserve.',
    author: { _type: 'reference', _ref: author._id },
    category: { _type: 'reference', _ref: category._id },
    status: 'published',
    seoTitle: 'EUR/USD Touches Monthly High Amid Fed Speculation',
    publishedAt: new Date().toISOString(),
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'The EUR/USD pair has experienced a bullish surge this week. The primary driver appears to be shifting expectations regarding the Federal Reserve\'s upcoming policy decisions. With inflation cooling slightly, traders are increasingly betting on a dovish pivot.' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'Meanwhile, the European Central Bank (ECB) has maintained a relatively hawkish stance, refusing to commit to aggressive easing. This divergence in central bank rhetoric has provided a strong tailwind for the Euro.' }]
      }
    ]
  })
  console.log('Created article 1:', article1._id)

  const article2 = await client.create({
    _type: 'article',
    title: 'Gold Retreats as Risk Appetite Returns',
    slug: { _type: 'slug', current: 'gold-retreats-risk-appetite' },
    excerpt: 'Safe-haven assets like gold are seeing mild sell-offs as equity markets rally.',
    author: { _type: 'reference', _ref: author._id },
    category: { _type: 'reference', _ref: category._id },
    status: 'published',
    seoTitle: 'Gold Retreats as Risk Appetite Returns',
    publishedAt: new Date().toISOString(),
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'Gold prices have dipped below the critical $2,400 resistance level. The precious metal, which traditionally benefits from market panic, is facing headwinds as global stock indices hit new record highs.' }]
      }
    ]
  })
  console.log('Created article 2:', article2._id)
}

seed().catch(console.error)
