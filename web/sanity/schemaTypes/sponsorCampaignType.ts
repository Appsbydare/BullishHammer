import { defineType, defineField } from 'sanity'
export const sponsorCampaignType = defineType({
  name: 'sponsorCampaign', title: 'Sponsor Campaign', type: 'document',
  fields: [
    defineField({ name: 'sponsorName', title: 'Sponsor Name', type: 'string' }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
    defineField({ name: 'adCopy', title: 'Ad Copy (Text)', type: 'text' }),
    defineField({ name: 'destinationUrl', title: 'Destination URL', type: 'url' }),
    defineField({ name: 'disclosureLabel', title: 'Disclosure Label', type: 'string', initialValue: 'Advertisement' }),
    defineField({ name: 'startDate', title: 'Start Date', type: 'datetime' }),
    defineField({ name: 'endDate', title: 'End Date', type: 'datetime' }),
    defineField({ name: 'eligibleCategories', title: 'Eligible Categories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }] }),
  ]
})