const fs = require('fs');
const path = require('path');

const files = {
  'sanity.config.ts': `import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemaTypes'
import { projectId, dataset } from './sanity/env'

export default defineConfig({
  basePath: '/admin',
  projectId,
  dataset,
  title: 'Bullish Hammer CMS',
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool(),
  ],
})`,
  'sanity/env.ts': `export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-07-15'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id'
export const useCdn = false`,
  'sanity/schemaTypes/authorType.ts': `import { defineType, defineField } from 'sanity'
export const authorType = defineType({
  name: 'author', title: 'Author', type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text' }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
  ]
})`,
  'sanity/schemaTypes/categoryType.ts': `import { defineType, defineField } from 'sanity'
export const categoryType = defineType({
  name: 'category', title: 'Category', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
  ]
})`,
  'sanity/schemaTypes/tagType.ts': `import { defineType, defineField } from 'sanity'
export const tagType = defineType({
  name: 'tag', title: 'Tag', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } })
  ]
})`,
  'sanity/schemaTypes/currencyPairType.ts': `import { defineType, defineField } from 'sanity'
export const currencyPairType = defineType({
  name: 'currencyPair', title: 'Currency Pair', type: 'document',
  fields: [
    defineField({ name: 'symbol', title: 'Symbol (e.g. EUR/USD)', type: 'string' }),
    defineField({ name: 'name', title: 'Name (e.g. Euro / US Dollar)', type: 'string' })
  ]
})`,
  'sanity/schemaTypes/sponsorCampaignType.ts': `import { defineType, defineField } from 'sanity'
export const sponsorCampaignType = defineType({
  name: 'sponsorCampaign', title: 'Sponsor Campaign', type: 'document',
  fields: [
    defineField({ name: 'sponsorName', title: 'Sponsor Name', type: 'string' }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
    defineField({ name: 'destinationUrl', title: 'Destination URL', type: 'url' }),
    defineField({ name: 'disclosureLabel', title: 'Disclosure Label', type: 'string', initialValue: 'Advertisement' }),
    defineField({ name: 'startDate', title: 'Start Date', type: 'datetime' }),
    defineField({ name: 'endDate', title: 'End Date', type: 'datetime' }),
    defineField({ name: 'eligibleCategories', title: 'Eligible Categories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }] }),
  ]
})`,
  'sanity/schemaTypes/articleType.ts': `import { defineType, defineField } from 'sanity'
export const articleType = defineType({
  name: 'article', title: 'Article', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text' }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image' }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }] }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'reference', to: [{ type: 'tag' }] }] }),
    defineField({ name: 'currencyPairs', title: 'Currency Pairs', type: 'array', of: [{ type: 'reference', to: [{ type: 'currencyPair' }] }] }),
    defineField({ name: 'sourceLinks', title: 'Source Links', type: 'array', of: [{ type: 'url' }] }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text' }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: [{title: 'Draft', value: 'draft'}, {title: 'Published', value: 'published'}] }, initialValue: 'draft' }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({ name: 'aiProvenance', title: 'AI Provenance Data', type: 'text', readOnly: true }),
  ]
})`,
  'sanity/schemaTypes/index.ts': `import { authorType } from './authorType'
import { categoryType } from './categoryType'
import { tagType } from './tagType'
import { currencyPairType } from './currencyPairType'
import { sponsorCampaignType } from './sponsorCampaignType'
import { articleType } from './articleType'

export const schemaTypes = [
  authorType,
  categoryType,
  tagType,
  currencyPairType,
  sponsorCampaignType,
  articleType,
]`,
  'src/app/admin/[[...tool]]/page.tsx': `'use client'
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'
export default function AdminPage() {
  return <NextStudio config={config} />
}`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
}
console.log('Sanity configuration files created.');
