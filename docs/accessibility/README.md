# Accessibility Guidelines

This document outlines the accessibility features and guidelines for the V0 Deaf Creator Platform.

## Overview

The platform is specifically designed for Deaf creators and users, with accessibility as a core principle. We adhere to WCAG 2.1 AA standards and beyond.

## Key Accessibility Features

### 1. Visual Communication

#### Video Captions
- **Automatic captioning** for all video content using AI transcription
- **Manual caption editing** for accuracy improvements
- **Multiple caption formats** (SRT, VTT, embedded)
- **Customizable caption styles** (font, size, color, position)

#### ASL Recognition
- **Real-time ASL gesture recognition** during video calls
- **ASL-to-text translation** for accessibility
- **Gesture library** with common signs

### 2. Visual Notifications

All notifications are visual-first:
- **Toast notifications** with visual indicators
- **Badge counters** for unread items
- **Screen flash** for urgent alerts
- **Color-coded status indicators**

```jsx
// Example: Visual notification component
<Toast 
  variant="visual"
  icon={<BellIcon />}
  title="New message"
  duration={5000}
/>
```

### 3. User Interface

#### Color Contrast
- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text
- High contrast mode available

#### Focus Indicators
- Visible focus states on all interactive elements
- Skip navigation links
- Logical tab order

#### Text Sizing
- Resizable text up to 200%
- No horizontal scrolling at 400% zoom
- Flexible layouts

### 4. Video Player

#### Accessible Controls
```
┌─────────────────────────────────────────────────────┐
│  ▶️ Play/Pause  │ ⏭️ Skip │ 🔇 Mute │ CC Captions │ ⚙️  │
├─────────────────────────────────────────────────────┤
│                 Video Content                        │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │          Captions appear here               │   │
│   └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### Features
- Keyboard accessible controls
- Caption toggle always visible
- Speed control (0.5x - 2x)
- Picture-in-picture support

### 5. Video Calls

#### Visual Communication Tools
- **Real-time captions** during calls
- **ASL spotlight mode** - enlarges signer
- **Gallery view** optimized for signing
- **Background blur** to reduce distractions

#### Quality Settings
- Prioritize video quality over audio
- Low-latency mode for real-time signing
- Bandwidth adaptive streaming

## WCAG 2.1 Compliance

### Level A Requirements ✓

| Criterion | Implementation |
|-----------|---------------|
| 1.1.1 Non-text Content | Alt text for all images |
| 1.2.1 Audio-only and Video-only | Transcripts provided |
| 1.2.2 Captions (Prerecorded) | All videos captioned |
| 1.3.1 Info and Relationships | Semantic HTML |
| 1.4.1 Use of Color | Not sole indicator |
| 2.1.1 Keyboard | Full keyboard support |
| 2.4.1 Bypass Blocks | Skip links |

### Level AA Requirements ✓

| Criterion | Implementation |
|-----------|---------------|
| 1.2.4 Captions (Live) | Real-time captioning |
| 1.2.5 Audio Description | Available on request |
| 1.4.3 Contrast (Minimum) | 4.5:1 ratio |
| 1.4.4 Resize Text | Up to 200% |
| 1.4.10 Reflow | Responsive design |
| 2.4.6 Headings and Labels | Descriptive headings |
| 2.4.7 Focus Visible | Clear focus states |

## Implementation Guidelines

### Component Development

```typescript
// Accessible button component
interface AccessibleButtonProps {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

function AccessibleButton({ label, onClick, ariaLabel, disabled }: AccessibleButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || label}
      disabled={disabled}
      className="focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {label}
    </button>
  );
}
```

### Video Captioning

```typescript
// Caption integration
interface CaptionTrack {
  language: string;
  label: string;
  src: string;
  default?: boolean;
}

function VideoPlayer({ src, captions }: { src: string; captions: CaptionTrack[] }) {
  return (
    <video controls>
      <source src={src} />
      {captions.map(track => (
        <track
          key={track.language}
          kind="captions"
          srcLang={track.language}
          src={track.src}
          label={track.label}
          default={track.default}
        />
      ))}
    </video>
  );
}
```

### Form Accessibility

```typescript
// Accessible form field
function FormField({ label, id, error, ...props }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

## Testing

### Manual Testing Checklist

- [ ] Navigate entire app using keyboard only
- [ ] Test with screen reader (NVDA, VoiceOver)
- [ ] Verify captions on all videos
- [ ] Check color contrast with tools
- [ ] Test at 200% and 400% zoom
- [ ] Verify focus indicators visible
- [ ] Test skip navigation links

### Automated Testing

We use the following tools:
- **axe-core** - Automated accessibility testing
- **pa11y** - Command line accessibility testing
- **Lighthouse** - Chrome DevTools audit

```bash
# Run accessibility tests
pnpm test:a11y
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [W3C WAI Resources](https://www.w3.org/WAI/resources/)
- [Deque University](https://dequeuniversity.com/)
- [A11y Project](https://www.a11yproject.com/)

## Feedback

We welcome accessibility feedback. Please report issues:
- GitHub Issues with `accessibility` label
- Email: accessibility@deafcreator.com
