# Contributing to JsonExport

Thank you for considering contributing to JsonExport! We welcome contributions from the community.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear Title**: Descriptive summary of the issue
- **Steps to Reproduce**: Detailed steps to recreate the problem
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable, add screenshots
- **Environment**: Browser version, OS, and any relevant details
- **Sample Data**: JSON example that triggers the issue (if applicable)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear, descriptive title**
- **Provide detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List any similar features** in other tools, if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes**:
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed
3. **Test your changes**:
   - Run `npm test` to ensure all tests pass
   - Run `npm run lint` to check code style
   - Test in multiple browsers if UI changes
4. **Commit your changes**:
   - Use clear, descriptive commit messages
   - Reference any related issues
5 **Submit a pull request**:
   - Provide a clear description of the changes
   - Link to any related issues
   - Include screenshots for UI changes

## Development Process

### Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/json_hub.git
cd json_hub

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

### Project Structure

```
json_hub/
├── app/                    # Next.js app directory (pages, layouts)
├── components/             # React components
├── lib/                    # Utility functions, parsers, converters
│   ├── parsers/           # JSON parsing logic
│   ├── converters/        # Export format converters
│   └── store/             # State management
├── tests/                  # Test files
└── types/                  # TypeScript type definitions
```

### Code Style

- **TypeScript**: All new code should use TypeScript
- **Formatting**: Follow existing Prettier/ESLint configuration
- **Components**: Use functional components with hooks
- **Naming**: Use descriptive variable and function names
  - Components: PascalCase (`DataGrid.tsx`)
  - Files: camelCase (`jsonToXlsx.ts`)
  - Constants: UPPER_SNAKE_CASE

### Writing Tests

- Place tests in the `tests/` directory
- Use descriptive test names: `it('should handle deeply nested objects', ...)`
- Test both success and error cases
- Aim for high code coverage

Example:
```typescript
import {smartParse} from '@/lib/parsers/smartParse';

describe('smartParse', () => {
  it('should parse valid JSON', () => {
    const result = smartParse('{"key": "value"}');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({key: 'value'});
  });
});
```

## Coding Guidelines

### Performance
- Optimize for large JSON files (up to 10MB)
- Use Web Workers for heavy processing when possible
- Avoid unnecessary re-renders in React components

### Accessibility
- Ensure keyboard navigation works
- Add proper ARIA labels
- Maintain sufficient color contrast

### Browser Support
- Test in Chrome, Firefox, Safari, and Edge
- Ensure features work without polyfills in modern browsers

## Community

- **Be respectful** and considerate in all interactions
- **Provide constructive feedback** in code reviews
- **Help others** by answering questions in issues and discussions

## Questions?

Feel free to open an issue labeled "question" or start a discussion in the GitHub Discussions tab.

---

**Thank you for contributing to JsonExport!**
