import { defineType, defineField } from 'sanity'
export const articleType = defineType({
  name: 'article', title: 'Article', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text' }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image' }),
    defineField({ name: 'bannerImageUrl', title: 'AI Banner Image URL', type: 'url', description: 'Auto-generated banner image from Pollinations. Override with a coverImage to use a custom image instead.' }),
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
    defineField({
      name: 'sponsorPlacements',
      title: 'Sponsor Placements',
      type: 'object',
      fields: [
        { name: 'slot1', title: 'Top Banner Slot (728x90)', type: 'reference', to: [{ type: 'sponsorCampaign' }] },
        { name: 'slot2', title: 'Mid-Content Rectangle Slot (300x250)', type: 'reference', to: [{ type: 'sponsorCampaign' }] },
      ]
    }),
  ]
})