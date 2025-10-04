/**
 * Reset stuck evaluation
 * Usage: node scripts/reset-evaluation.js <projectId> <departmentId>
 */

import { MongoClient, ObjectId } from 'mongodb'
import 'dotenv/config'

const projectId = process.argv[2] || '68df4dab400c86a6a8cf40c6'
const departmentId = process.argv[3] || '68df4d86400c86a6a8cf3fa7'

async function resetEvaluation() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aladdin')

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()

    // Convert string IDs to ObjectId for MongoDB query
    const projectObjId = new ObjectId(projectId)

    // First, let's see what's in the collection
    const docs = await db
      .collection('project-readinesses')
      .find({ projectId: projectObjId })
      .toArray()
    console.log('Found documents:', docs.length)
    docs.forEach((doc) => {
      console.log(
        `  - Department: ${doc.departmentId}, Status: ${doc.status}, TaskId: ${doc.taskId}`,
      )
    })

    // Delete all evaluation records for this project to start fresh
    const deleteResult = await db
      .collection('project-readinesses')
      .deleteMany({ projectId: projectObjId })

    console.log(`Deleted ${deleteResult.deletedCount} evaluation records`)
    console.log(`✅ All evaluations cleared for project ${projectId}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

resetEvaluation()
