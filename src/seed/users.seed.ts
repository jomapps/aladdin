import type { Payload } from 'payload'

export async function seedUsers(payload: Payload) {
  console.log('👤 Seeding users...')

  const users = [
    {
      email: 'admin@aladdin.dev',
      password: 'admin123',
      name: 'Admin User',
    },
    {
      email: 'creator@aladdin.dev',
      password: 'creator123',
      name: 'Content Creator',
    },
    {
      email: 'demo@aladdin.dev',
      password: 'demo123',
      name: 'Demo User',
    },
  ]

  let created = 0
  for (const u of users) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: u.email } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  ⏭️  User exists: ${u.email}`)
      continue
    }

    await payload.create({ collection: 'users', data: u })
    console.log(`  ✅ Created user: ${u.email}`)
    created++
  }

  console.log(`✅ Users seeded (${created}/${users.length} created)`) 
}

