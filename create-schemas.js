const fs = require('fs');
const path = require('path');

const files = {
  'studio/schemaTypes/author.ts': `import { defineType, defineField } from 'sanity'
export const author = defineType({
  name: 'author', title: 'Author', type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text' }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
  ]
})`,
  'studio/schemaTypes/category.ts': `import { defineType, defineField } from 'sanity'
export const category = defineType({
  name: 'category', title: 'Category', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
  ]
})`,
  'studio/schemaTypes/tag.ts': `import { defineType, defineField } from 'sanity'
export const tag = defineType({
  name: 'tag', title: 'Tag', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } })
  ]
})`,
  'studio/schemaTypes/currencyPair.ts': `import { defineType, defineField } from 'sanity'
export const currencyPair = defineType({
  name: 'currencyPair', title: 'Currency Pair', type: 'document',
  fields: [
    defineField({ name: 'symbol', title: 'Symbol (e.g. EUR/USD)', type: 'string' }),
    defineField({ name: 'name', title: 'Name (e.g. Euro / US Dollar)', type: 'string' })
  ]
})`,
  'studio/schemaTypes/sponsorCampaign.ts': `import { defineType, defineField } from 'sanity'
export const sponsorCampaign = defineType({
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
  'studio/schemaTypes/article.ts': `import { defineType, defineField } from 'sanity'
export const article = defineType({
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
  'studio/schemaTypes/index.ts': `import { author } from './author'
import { category } from './category'
import { tag } from './tag'
import { currencyPair } from './currencyPair'
import { sponsorCampaign } from './sponsorCampaign'
import { article } from './article'

export const schemaTypes = [
  author,
  category,
  tag,
  currencyPair,
  sponsorCampaign,
  article,
]`
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
