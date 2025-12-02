# Contributing to V0 Deaf Creator Platform

Thank you for your interest in contributing to the V0 Deaf Creator Platform! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Testing](#testing)

## Code of Conduct

This project is committed to providing a welcoming and inclusive environment for everyone. We expect all contributors to:

- Be respectful and considerate
- Use inclusive language
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/v0-deaf-creator-platform-multi-tenants.git
   cd v0-deaf-creator-platform-multi-tenants
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a `.env.local` file with required environment variables
5. Start the development server:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

Examples:
- `feature/asl-gesture-recognition`
- `fix/video-upload-timeout`
- `docs/api-documentation`

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(video): add ASL gesture recognition API
fix(upload): resolve timeout on large video uploads
docs(api): update video matching endpoint documentation
```

## Pull Request Process

1. **Create a feature branch** from `development`:
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature
   ```

2. **Make your changes** following the coding standards

3. **Write/update tests** for your changes

4. **Run linting and tests**:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

5. **Push your branch**:
   ```bash
   git push origin feature/your-feature
   ```

6. **Create a Pull Request** with:
   - Clear description of changes
   - Screenshots for UI changes
   - Reference to related issues
   - Accessibility impact assessment

7. **Address review feedback** and update as needed

8. **Merge** after approval (maintainers will merge)

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Document complex functions with JSDoc

```typescript
/**
 * Calculate match score between creator and task
 * @param creator - Creator profile
 * @param task - Task requirements
 * @returns Match score between 0 and 1
 */
function calculateMatchScore(
  creator: CreatorProfile,
  task: TaskRequirements
): number {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Props should be typed with interfaces
- Use descriptive component names
- Keep components focused and small

```typescript
interface VideoPlayerProps {
  src: string;
  captions?: CaptionTrack[];
  onEnded?: () => void;
}

export function VideoPlayer({ src, captions, onEnded }: VideoPlayerProps) {
  // Implementation
}
```

### Styling

- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Maintain consistent spacing and colors
- Use CSS variables from design system

## Accessibility Guidelines

**This is a platform for Deaf creators. Accessibility is not optional.**

### Requirements

1. **All videos must support captions**
2. **UI must be fully keyboard navigable**
3. **Color must not be the only indicator**
4. **All images need alt text**
5. **Focus states must be visible**
6. **WCAG 2.1 AA compliance minimum**

### Testing Accessibility

- Use keyboard to navigate all features
- Test with screen readers (NVDA, VoiceOver)
- Verify color contrast ratios
- Run automated accessibility tests

```bash
pnpm test:a11y
```

### Sign Language Considerations

When building video features:
- Prioritize video quality for clear signing
- Support ASL spotlight mode
- Minimize video latency
- Enable background blur options

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Specific test file
pnpm test src/matching_engine/index.test.ts

# With coverage
pnpm test --coverage

# Accessibility tests
pnpm test:a11y
```

### Writing Tests

- Place tests adjacent to source files or in `tests/` directory
- Use descriptive test names
- Cover edge cases
- Mock external services

```typescript
describe('calculateMatchScore', () => {
  it('should return 1.0 for perfect skill match', () => {
    const creator = { skills: ['asl', 'editing'] };
    const task = { skills: ['asl', 'editing'] };
    
    expect(calculateMatchScore(creator, task)).toBe(1.0);
  });

  it('should return 0 for no skill match', () => {
    const creator = { skills: ['asl'] };
    const task = { skills: ['editing'] };
    
    expect(calculateMatchScore(creator, task)).toBe(0);
  });
});
```

## Questions?

- Open a [GitHub Discussion](https://github.com/pinkycollie/v0-deaf-creator-platform-multi-tenants/discussions)
- Email: contributors@deafcreator.com

Thank you for contributing! 🙏
