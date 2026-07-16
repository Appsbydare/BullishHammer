import { defineConfig } from 'sanity'
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
})