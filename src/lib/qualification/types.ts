/**
 * TypeScript Types for Qualification Departments
 */

export interface WorldData {
  projectId: string
  projectSlug: string
  worldElements: any[]
  characters: any[]
  locations: any[]
  rules: any[]
}

export interface StoryBible {
  title: string
  version: string
  synopsis: string
  worldRules: Array<{
    ruleName: string
    category: 'magic' | 'technology' | 'geography' | 'society' | 'physics' | 'history' | 'politics' | 'economy'
    description: string
    constraints?: string
    examples?: string
    priority: 'critical' | 'high' | 'medium' | 'low'
  }>
  characterRelationships: any
  relationshipDetails: Array<{
    character1: string
    character2: string
    relationshipType: 'family' | 'friend' | 'romantic' | 'enemy' | 'rival' | 'mentor' | 'professional' | 'acquaintance'
    description: string
    dynamicStatus?: 'static' | 'improving' | 'deteriorating' | 'complex'
    keyMoments?: string
  }>
  timeline: Array<{
    eventName: string
    timestamp?: string
    description: string
    participants?: Array<{ character: string }>
    location?: string
    importance: 'critical' | 'major' | 'minor' | 'background'
    consequences?: string
  }>
  consistencyRules: Array<{
    ruleName: string
    category: 'character-appearance' | 'location' | 'props' | 'visual-style' | 'narrative' | 'technical'
    description: string
    enforcement: 'strict' | 'recommended' | 'guideline' | 'flexible'
    priority?: number
    checkpoints?: string
    exceptions?: string
  }>
  locations: Array<{
    locationName: string
    description: string
    visualReference?: string
    atmosphere?: string
    keyFeatures?: Array<{ feature: string; description?: string }>
    timeOfDayVariations?: string
    connectedLocations?: Array<{ locationName: string; connectionType?: string }>
  }>
  themes: Array<{
    theme: string
    description?: string
    visualMotifs?: string
    colorAssociations?: string
    sceneReferences?: Array<{ sceneNumber: string; howThemeAppears?: string }>
  }>
  visualStyleGuide?: {
    primaryStyle?: string
    colorPalette?: string
    artDirection?: string
    influences?: string
    prohibitedElements?: string
  }
}

export interface Character {
  name: string
  description: string
  role: string
  traits: any
}

export interface Screenplay {
  title: string
  logline: string
  synopsis: string
  screenplay: string
  sceneCount: number
  estimatedDuration: number
}

export interface Scene {
  sceneNumber: string
  sequenceOrder: number
  screenplayText: string
  expectedDuration: number // in seconds (3-7)
  dramaticEffect: {
    intensity: number // 0-10
    emotionalTone: string
    pacing: string
    visualImpact: string
    narrativeFunction: string
  }
  cameraDirection?: {
    shotType: string
    movement: string
    angle: string
    focus: string
  }
  lightingDirection?: {
    style: string
    mood: string
    keyLighting: string
    colorTemperature: string
  }
  location?: string
  timeOfDay?: string
  characters?: string[]
}

export interface DepartmentResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata: {
    projectId: string
    projectSlug: string
    processedAt: Date
    processingTime: number
    userId: string
  }
}

export interface WorldDepartmentResult extends DepartmentResult<StoryBible> {
  worldElementsCount: number
  charactersCount: number
  locationsCount: number
  rulesCount: number
}

export interface StoryDepartmentResult extends DepartmentResult<{
  screenplay: Screenplay
  scenes: Scene[]
}> {
  sceneCount: number
  estimatedDuration: number
}
