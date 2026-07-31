import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemaTypes'
import { projectId, dataset } from './sanity/env'

export default defineConfig({
  // Must match the route segment at src/app/studio/[[...tool]].
  // Previously '/admin', which collided with the custom admin dashboard.
  basePath: '/studio',
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