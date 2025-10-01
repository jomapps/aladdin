/**
 * Test Fixtures - Entity Data
 * Sample entity data for testing
 */

export const mockCharacter = {
  id: 'char-001',
  name: 'John Doe',
  description: 'A brave detective seeking justice in a corrupt city. Former military officer turned private investigator.',
  age: 35,
  occupation: 'Private Detective',
  background: 'Ex-military, discharged honorably after 10 years of service'
}

export const mockScene = {
  id: 'scene-001',
  name: 'Opening Chase',
  sceneNumber: 1,
  content: `INT. WAREHOUSE - NIGHT

John bursts through the door, gun drawn. Shadows dance across the walls from the flickering fluorescent lights. He moves cautiously, checking corners.

JOHN
(whispering into radio)
I'm in position. No sign of the target yet.

A sound from above. John looks up just as a figure drops down, landing in front of him.`,
  duration: 180,
  location: 'Abandoned Warehouse'
}

export const mockLocation = {
  id: 'loc-001',
  name: 'Abandoned Warehouse',
  description: 'Dark, dusty warehouse on the outskirts of the city. Once a thriving shipping facility, now home to criminal activity.',
  locationType: 'interior',
  address: '1234 Industrial Blvd',
  features: ['Loading docks', 'Office space', 'Storage area']
}

export const mockEpisode = {
  id: 'ep-001',
  title: 'Pilot',
  number: 1,
  season: 1,
  description: 'Detective John Doe takes on his first case as a private investigator, uncovering a conspiracy that goes deeper than he imagined.',
  airDate: '2024-01-15',
  duration: 3600
}

export const mockConcept = {
  id: 'concept-001',
  name: 'Justice vs. Revenge',
  description: 'The central theme exploring whether true justice can coexist with personal revenge, or if they are fundamentally opposed.',
  category: 'theme',
  importance: 'high'
}

export const mockInvalidCharacter = {
  id: 'char-invalid',
  // Missing required name
  description: 'Invalid character missing required fields'
}

export const mockMinimalCharacter = {
  id: 'char-minimal',
  name: 'Minimal Character'
  // Missing description (should fail validation)
}

export const mockCompleteCharacter = {
  id: 'char-complete',
  name: 'Complete Character',
  description: 'A fully detailed character with all fields',
  age: 30,
  occupation: 'Lawyer',
  background: 'Harvard Law graduate',
  physicalDescription: 'Tall, athletic build, short dark hair',
  personality: 'Confident, intelligent, sometimes arrogant',
  goals: ['Win high-profile cases', 'Become partner'],
  fears: ['Failure', 'Public embarrassment'],
  relationships: {
    'char-001': 'rival'
  }
}

export const mockComplexScene = {
  id: 'scene-complex',
  name: 'Courtroom Showdown',
  sceneNumber: 45,
  content: `INT. COURTROOM - DAY

The packed courtroom buzzes with anticipation. JOHN sits at the defense table, reviewing his notes. Across the aisle, SARAH, the prosecutor, radiates confidence.

JUDGE
(banging gavel)
Order! Mr. Doe, you may call your witness.

JOHN
(standing)
Your Honor, I call Detective Martinez to the stand.

DETECTIVE MARTINEZ enters through the double doors. The crowd murmurs.

SARAH
(whispering to assistant)
This changes everything.`,
  duration: 420,
  location: 'City Courthouse',
  characters: ['char-001', 'char-002', 'char-003'],
  importance: 'high',
  emotionalTone: 'tense',
  tags: ['climax', 'revelation']
}

export const mockBatchCharacters = Array.from({ length: 5 }, (_, i) => ({
  id: `char-batch-${i + 1}`,
  name: `Character ${i + 1}`,
  description: `Description for character ${i + 1}`
}))

export const mockBatchScenes = Array.from({ length: 5 }, (_, i) => ({
  id: `scene-batch-${i + 1}`,
  name: `Scene ${i + 1}`,
  sceneNumber: i + 1,
  content: `Content for scene ${i + 1}`
}))

export const mockEdgeCases = {
  emptyString: {
    id: 'edge-001',
    name: '',
    description: ''
  },
  veryLongName: {
    id: 'edge-002',
    name: 'A'.repeat(1000),
    description: 'Normal description'
  },
  specialCharacters: {
    id: 'edge-003',
    name: 'Character with "quotes" and \'apostrophes\'',
    description: 'Has special chars: @#$%^&*()'
  },
  unicode: {
    id: 'edge-004',
    name: '日本語キャラクター',
    description: 'Unicode characters: 你好 مرحبا שלום'
  },
  htmlTags: {
    id: 'edge-005',
    name: '<script>alert("XSS")</script>',
    description: '<b>Bold</b> and <i>italic</i> tags'
  }
}
