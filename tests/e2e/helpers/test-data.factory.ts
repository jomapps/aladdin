/**
 * Test Data Factory
 * 
 * Generates test data for E2E tests
 */

export interface TestProject {
  name: string
  description: string
  genre?: string
  duration?: number
}

export interface TestScene {
  name: string
  description: string
  duration: number
  order: number
}

export interface TestCharacter {
  name: string
  description: string
  role: string
  traits?: string[]
}

/**
 * Generate a unique project name
 */
export function generateProjectName(prefix: string = 'Test Project'): string {
  return `${prefix} ${Date.now()}`
}

/**
 * Generate a test project
 */
export function createTestProject(overrides?: Partial<TestProject>): TestProject {
  return {
    name: generateProjectName(),
    description: 'A test project created for E2E testing',
    genre: 'Drama',
    duration: 120,
    ...overrides
  }
}

/**
 * Generate multiple test projects
 */
export function createTestProjects(count: number, prefix?: string): TestProject[] {
  return Array.from({ length: count }, (_, i) => 
    createTestProject({ 
      name: generateProjectName(`${prefix || 'Project'} ${i + 1}`)
    })
  )
}

/**
 * Generate a test scene
 */
export function createTestScene(overrides?: Partial<TestScene>): TestScene {
  const sceneNumber = Math.floor(Math.random() * 100) + 1
  return {
    name: `Scene ${sceneNumber}`,
    description: `Test scene ${sceneNumber} description`,
    duration: 60,
    order: sceneNumber,
    ...overrides
  }
}

/**
 * Generate multiple test scenes
 */
export function createTestScenes(count: number): TestScene[] {
  return Array.from({ length: count }, (_, i) => 
    createTestScene({ 
      name: `Scene ${i + 1}`,
      order: i + 1
    })
  )
}

/**
 * Generate a test character
 */
export function createTestCharacter(overrides?: Partial<TestCharacter>): TestCharacter {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank']
  const roles = ['Protagonist', 'Antagonist', 'Supporting', 'Minor']
  
  return {
    name: names[Math.floor(Math.random() * names.length)],
    description: 'A test character for E2E testing',
    role: roles[Math.floor(Math.random() * roles.length)],
    traits: ['brave', 'intelligent', 'mysterious'],
    ...overrides
  }
}

/**
 * Generate multiple test characters
 */
export function createTestCharacters(count: number): TestCharacter[] {
  return Array.from({ length: count }, (_, i) => 
    createTestCharacter({ name: `Character ${i + 1}` })
  )
}

/**
 * Generate random text
 */
export function generateRandomText(length: number = 100): string {
  const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
    'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor'
  ]
  
  let text = ''
  while (text.length < length) {
    text += words[Math.floor(Math.random() * words.length)] + ' '
  }
  
  return text.trim().substring(0, length)
}

/**
 * Generate a unique email
 */
export function generateEmail(prefix: string = 'test'): string {
  return `${prefix}+${Date.now()}@example.com`
}

/**
 * Generate test user data
 */
export function createTestUser(overrides?: {
  email?: string
  password?: string
  name?: string
}) {
  return {
    email: overrides?.email || generateEmail(),
    password: overrides?.password || 'testpassword123',
    name: overrides?.name || 'Test User'
  }
}

/**
 * Wait helper
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate random number in range
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate random item from array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Test data cleanup tracker
 */
export class TestDataTracker {
  private projects: string[] = []
  private users: string[] = []
  
  trackProject(projectId: string): void {
    this.projects.push(projectId)
  }
  
  trackUser(userId: string): void {
    this.users.push(userId)
  }
  
  getProjects(): string[] {
    return [...this.projects]
  }
  
  getUsers(): string[] {
    return [...this.users]
  }
  
  clear(): void {
    this.projects = []
    this.users = []
  }
}

/**
 * Mock API responses
 */
export const mockResponses = {
  project: {
    id: 'mock-project-id',
    name: 'Mock Project',
    description: 'A mock project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  scene: {
    id: 'mock-scene-id',
    name: 'Mock Scene',
    description: 'A mock scene',
    duration: 60,
    order: 1
  },
  
  character: {
    id: 'mock-character-id',
    name: 'Mock Character',
    description: 'A mock character',
    role: 'Protagonist'
  }
}

/**
 * Test timeouts
 */
export const TIMEOUTS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
  VERY_LONG: 30000
}

/**
 * Test selectors
 */
export const SELECTORS = {
  // Auth
  emailInput: 'input[name="email"], input[type="email"]',
  passwordInput: 'input[name="password"], input[type="password"]',
  submitButton: 'button[type="submit"]',
  logoutButton: 'button:has-text("Sign Out"), button:has-text("Logout")',
  
  // Dashboard
  welcomeMessage: 'text=/Welcome back/i',
  newProjectButton: 'button:has-text("New Project"), button:has-text("Create Project")',
  projectCard: '[data-testid="project-card"], [class*="project-card"]',
  
  // Dialogs
  dialog: '[role="dialog"], [class*="dialog"]',
  dialogClose: 'button:has-text("Cancel"), button[aria-label="Close"]',
  
  // Navigation
  nav: 'nav, [role="navigation"]',
  mobileMenuButton: 'button[aria-label*="menu" i], button:has-text("Menu")',
  
  // Forms
  nameInput: 'input[name="name"], input[placeholder*="name" i]',
  descriptionInput: 'textarea[name="description"], textarea[placeholder*="description" i]'
}

/**
 * Test URLs
 */
export const URLS = {
  home: '/',
  dashboard: '/dashboard',
  projects: '/dashboard/projects',
  team: '/dashboard/team',
  login: '/',
  logout: '/api/auth/logout'
}

