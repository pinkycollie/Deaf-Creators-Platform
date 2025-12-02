/**
 * Accessibility Utilities Library
 * Provides helpers for WCAG compliance and ASL support
 */

// WCAG 2.1 Level AA compliance utilities

/**
 * Color contrast checker for WCAG compliance
 * Ensures text meets minimum contrast requirements
 */
export function checkColorContrast(
  foreground: string,
  background: string
): { ratio: number; passesAA: boolean; passesAAA: boolean } {
  const fgLuminance = getRelativeLuminance(foreground)
  const bgLuminance = getRelativeLuminance(background)
  
  const ratio =
    (Math.max(fgLuminance, bgLuminance) + 0.05) /
    (Math.min(fgLuminance, bgLuminance) + 0.05)

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5, // WCAG AA for normal text
    passesAAA: ratio >= 7, // WCAG AAA for normal text
  }
}

/**
 * Calculate relative luminance for color contrast
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    v = v / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Screen reader announcements
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  const announcement = document.createElement("div")
  announcement.setAttribute("role", "status")
  announcement.setAttribute("aria-live", priority)
  announcement.setAttribute("aria-atomic", "true")
  announcement.className = "sr-only"
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus trap for modals and dialogs
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void
  deactivate: () => void
} {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Tab") return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus()
        e.preventDefault()
      }
    }
  }

  return {
    activate: () => {
      container.addEventListener("keydown", handleKeyDown)
      firstElement?.focus()
    },
    deactivate: () => {
      container.removeEventListener("keydown", handleKeyDown)
    },
  }
}

/**
 * Skip link utilities for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  label: string = "Skip to main content"
): HTMLAnchorElement {
  const link = document.createElement("a")
  link.href = `#${targetId}`
  link.className =
    "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
  link.textContent = label
  return link
}

/**
 * ARIA live region manager
 */
export class LiveRegionManager {
  private region: HTMLDivElement

  constructor(ariaLive: "polite" | "assertive" = "polite") {
    this.region = document.createElement("div")
    this.region.setAttribute("role", "status")
    this.region.setAttribute("aria-live", ariaLive)
    this.region.setAttribute("aria-atomic", "true")
    this.region.className = "sr-only"
    document.body.appendChild(this.region)
  }

  announce(message: string): void {
    this.region.textContent = ""
    // Force reflow for screen readers
    void this.region.offsetHeight
    this.region.textContent = message
  }

  destroy(): void {
    document.body.removeChild(this.region)
  }
}

/**
 * ASL (American Sign Language) support utilities
 */

// Common ASL phrases with translations
export const ASL_PHRASES: Record<string, { phrase: string; description: string }> = {
  hello: { phrase: "HELLO", description: "Open hand wave near forehead" },
  thank_you: { phrase: "THANK-YOU", description: "Flat hand from chin forward" },
  please: { phrase: "PLEASE", description: "Circular motion on chest" },
  sorry: { phrase: "SORRY", description: "Fist circular motion on chest" },
  yes: { phrase: "YES", description: "Fist nodding motion" },
  no: { phrase: "NO", description: "Index and middle finger snap to thumb" },
  help: { phrase: "HELP", description: "Fist on palm, lift together" },
  understand: { phrase: "UNDERSTAND", description: "Index finger flicks up from temple" },
  deaf: { phrase: "DEAF", description: "Point to ear, then to mouth" },
  hearing: { phrase: "HEARING", description: "Index finger circles near ear" },
}

/**
 * Get ASL fingerspelling description for a word
 */
export function getASLFingerspelling(word: string): string[] {
  return word
    .toUpperCase()
    .split("")
    .map((letter) => {
      // Return description for each letter position
      // This would be enhanced with actual fingerspelling images/descriptions
      return `Letter ${letter}`
    })
}

/**
 * Check if content has ASL alternatives
 */
export interface ASLContentCheck {
  hasASLVideo: boolean
  hasASLCaptions: boolean
  hasASLDescription: boolean
  score: number // 0-100 accessibility score
}

export function checkASLAccessibility(content: {
  hasVideo?: boolean
  hasCaptions?: boolean
  hasAudioDescription?: boolean
  hasASLInterpretation?: boolean
}): ASLContentCheck {
  let score = 0
  
  if (content.hasVideo) score += 25
  if (content.hasCaptions) score += 25
  if (content.hasAudioDescription) score += 25
  if (content.hasASLInterpretation) score += 25

  return {
    hasASLVideo: !!content.hasASLInterpretation,
    hasASLCaptions: !!content.hasCaptions,
    hasASLDescription: !!content.hasAudioDescription,
    score,
  }
}

/**
 * Visual indicator utilities for deaf users
 */
export interface VisualAlert {
  type: "notification" | "error" | "warning" | "success"
  message: string
  duration?: number
}

export function createVisualAlert(alert: VisualAlert): HTMLDivElement {
  const alertDiv = document.createElement("div")
  alertDiv.setAttribute("role", "alert")
  alertDiv.setAttribute("aria-live", "assertive")
  
  const colors: Record<string, string> = {
    notification: "bg-blue-100 border-blue-500 text-blue-800",
    error: "bg-red-100 border-red-500 text-red-800",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-800",
    success: "bg-green-100 border-green-500 text-green-800",
  }
  
  alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg border-l-4 ${colors[alert.type]} z-50 animate-pulse`
  alertDiv.textContent = alert.message

  document.body.appendChild(alertDiv)

  if (alert.duration) {
    setTimeout(() => {
      alertDiv.remove()
    }, alert.duration)
  }

  return alertDiv
}

/**
 * Keyboard navigation helpers
 */
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
} as const

export function handleKeyboardNavigation(
  e: KeyboardEvent,
  handlers: Partial<Record<keyof typeof KEYBOARD_KEYS, () => void>>
): void {
  const key = Object.entries(KEYBOARD_KEYS).find(
    ([, value]) => value === e.key
  )?.[0] as keyof typeof KEYBOARD_KEYS | undefined

  if (key && handlers[key]) {
    e.preventDefault()
    handlers[key]!()
  }
}

/**
 * Reduced motion detection and preferences
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * High contrast mode detection
 */
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-contrast: high)").matches
}

/**
 * Generate accessible error messages
 */
export function generateAccessibleErrorMessage(
  field: string,
  errorType: string,
  customMessage?: string
): string {
  const messages: Record<string, string> = {
    required: `${field} is required`,
    email: `Please enter a valid email address for ${field}`,
    minLength: `${field} is too short`,
    maxLength: `${field} is too long`,
    pattern: `${field} format is invalid`,
    custom: customMessage || `${field} has an error`,
  }

  return messages[errorType] || messages.custom
}

/**
 * Table accessibility helpers
 */
export function makeTableAccessible(table: HTMLTableElement): void {
  // Add caption if missing
  if (!table.querySelector("caption")) {
    const caption = document.createElement("caption")
    caption.className = "sr-only"
    caption.textContent = "Data table"
    table.prepend(caption)
  }

  // Ensure headers have scope
  const headers = table.querySelectorAll("th")
  headers.forEach((th) => {
    if (!th.hasAttribute("scope")) {
      th.setAttribute("scope", "col")
    }
  })

  // Add role if not present
  if (!table.hasAttribute("role")) {
    table.setAttribute("role", "table")
  }
}

/**
 * Form accessibility helpers
 */
export function connectLabelToInput(
  label: HTMLLabelElement,
  input: HTMLInputElement
): void {
  if (!input.id) {
    // Use crypto.randomUUID() for better collision resistance
    input.id = `input-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`
  }
  label.setAttribute("for", input.id)
}

/**
 * Image accessibility helpers
 */
export function ensureImageAccessibility(
  img: HTMLImageElement,
  fallbackAlt: string = "Image"
): void {
  if (!img.alt) {
    img.alt = fallbackAlt
  }
  
  // Mark decorative images appropriately
  if (img.dataset.decorative === "true") {
    img.alt = ""
    img.setAttribute("role", "presentation")
  }
}

/**
 * Video player accessibility
 */
export interface AccessibleVideoOptions {
  captions?: boolean
  audioDescription?: boolean
  signLanguage?: boolean
  transcript?: boolean
}

export function getVideoAccessibilityScore(
  options: AccessibleVideoOptions
): number {
  let score = 0
  if (options.captions) score += 30
  if (options.audioDescription) score += 25
  if (options.signLanguage) score += 25
  if (options.transcript) score += 20
  return score
}
