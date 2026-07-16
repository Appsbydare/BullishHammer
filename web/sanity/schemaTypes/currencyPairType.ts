import { defineType, defineField } from 'sanity'
export const currencyPairType = defineType({
  name: 'currencyPair', title: 'Currency Pair', type: 'document',
  fields: [
    defineField({ name: 'symbol', title: 'Symbol (e.g. EUR/USD)', type: 'string' }),
    defineField({ name: 'name', title: 'Name (e.g. Euro / US Dollar)', type: 'string' })
  ]
})