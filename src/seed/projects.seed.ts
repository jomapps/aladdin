import type { Payload } from 'payload'

// Minimal shape matching src/collections/Projects.ts
// Relationship fields must use IDs, so we resolve owner by email first
export async function seedProjects(payload: Payload) {
  console.log('\ud83c\udfac Seeding projects...')

  const projects = [
    {
      name: 'Cyberpunk Detective',
      slug: 'cyberpunk-detective',
      type: 'movie',
      phase: 'expansion',
      status: 'active',
      logline:
        'In a neon-lit future, a rogue AI detective must solve a murder that could unravel the fabric of reality itself.',
      synopsis:
        "Elena Rodriguez, a cybersecurity expert turned AI detective, discovers that a series of seemingly unrelated murders are connected to a quantum computing conspiracy.",
      ownerEmail: 'admin@aladdin.dev',
      overallQuality: 0.78,
      qualityBreakdown: { story: 0.82, characters: 0.75, visuals: 0.8, technical: 0.75 },
      settings: { brainValidationRequired: true, minQualityThreshold: 0.75, autoGenerateImages: true },
      isPublic: false,
    },
    {
      name: 'The Last Garden',
      slug: 'the-last-garden',
      type: 'movie',
      phase: 'expansion',
      status: 'active',
      logline:
        "After Earth's ecosystem collapses, a botanist discovers the last living garden—and the ancient secret it protects.",
      synopsis:
        'In 2087, Earth is a barren wasteland. Dr. Maya Chen, a botanist working in underground seed vaults, receives a mysterious signal from the Sahara Desert.',
      ownerEmail: 'creator@aladdin.dev',
      overallQuality: 0.72,
      qualityBreakdown: { story: 0.7, characters: 0.68, visuals: 0.85, technical: 0.65 },
      settings: { brainValidationRequired: true, minQualityThreshold: 0.7, autoGenerateImages: true },
      isPublic: false,
    },
    {
      name: 'Midnight Diner Chronicles',
      slug: 'midnight-diner-chronicles',
      type: 'series',
      phase: 'expansion',
      status: 'active',
      logline:
        'A mysterious late-night diner serves more than food—it serves second chances, one customer at a time.',
      synopsis:
        "Marcus Chen runs a small diner that only opens from midnight to 7 AM. Each night, strangers with troubled pasts find their way to his door...",
      ownerEmail: 'creator@aladdin.dev',
      overallQuality: 0.85,
      qualityBreakdown: { story: 0.88, characters: 0.9, visuals: 0.78, technical: 0.85 },
      settings: { brainValidationRequired: true, minQualityThreshold: 0.8, autoGenerateImages: false },
      isPublic: false,
    },
    {
      name: 'Demo Project',
      slug: 'demo-project-001',
      type: 'movie',
      phase: 'expansion',
      status: 'active',
      logline: 'A simple demo project for testing the Aladdin platform.',
      synopsis:
        "This is a demo project used for testing and development purposes. It contains sample data and demonstrates the platform's capabilities.",
      ownerEmail: 'demo@aladdin.dev',
      overallQuality: 0.5,
      qualityBreakdown: { story: 0.5, characters: 0.5, visuals: 0.5, technical: 0.5 },
      settings: { brainValidationRequired: false, minQualityThreshold: 0.5, autoGenerateImages: false },
      isPublic: true,
    },
  ] as const

  let created = 0

  for (const p of projects) {
    // Skip if project exists by unique slug
    const existing = await payload.find({
      collection: 'projects',
      where: { slug: { equals: p.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      console.log(`  \u23ed\ufe0f  Project exists: ${p.slug}`)
      continue
    }

    // Find owner by email, use ID for relationship field
    const ownerLookup = await payload.find({
      collection: 'users',
      where: { email: { equals: p.ownerEmail } },
      limit: 1,
    })
    if (ownerLookup.docs.length === 0) {
      console.log(`  \u26a0\ufe0f Owner not found for ${p.slug}: ${p.ownerEmail} — skipping`)
      continue
    }

    const ownerId = ownerLookup.docs[0].id

    // openDatabaseName is auto-generated from slug via beforeValidate hook in Projects collection
    await payload.create({
      collection: 'projects',
      data: {
        name: p.name,
        slug: p.slug,
        type: p.type as any,
        phase: p.phase as any,
        status: p.status as any,
        logline: p.logline,
        synopsis: p.synopsis,
        overallQuality: p.overallQuality,
        qualityBreakdown: p.qualityBreakdown as any,
        settings: p.settings as any,
        isPublic: p.isPublic,
        owner: ownerId,
      },
    })

    console.log(`  \u2705 Created project: ${p.slug}`)
    created++
  }

  console.log(`\u2705 Projects seeded (${created}/${projects.length} created)`) 
}

