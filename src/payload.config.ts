// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Episodes } from './collections/Episodes'
import { Conversations } from './collections/Conversations'
import { Workflows } from './collections/Workflows'
import { ActivityLogs } from './collections/ActivityLogs'
import { ExportJobs } from './collections/ExportJobs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const s3Adapter = s3Storage({
  config: {
    endpoint: process.env.R2_ENDPOINT,
    region: 'auto', // Required for Cloudflare R2
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // Required for R2
  },
  bucket: process.env.R2_BUCKET_NAME!,
  collections: {
    media: {
      prefix: 'media', // Optional: organize files in a folder
      generateFileURL: ({ filename }) => {
        // Generate the public URL using the custom domain
        const baseUrl = process.env.R2_PUBLIC_URL || 'https://media.rumbletv.com'
        return `${baseUrl}/media/${filename}`
      },
    },
  },
})

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Projects,
    Episodes,
    Conversations,
    Workflows,
    ActivityLogs,
    ExportJobs,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    s3Adapter,
    // storage-adapter-placeholder
  ],
})
