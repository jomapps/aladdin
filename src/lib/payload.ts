/**
 * Payload Client Helper
 */

import { getPayload as getPayloadInstance } from 'payload'
import config from '@/payload.config'

let cachedPayload: any = null

export async function getPayloadClient() {
  if (cachedPayload) {
    return cachedPayload
  }

  cachedPayload = await getPayloadInstance({ config })
  return cachedPayload
}

