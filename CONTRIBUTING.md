# Contributing to AI-Powered SEO Analysis Platform

Thank you for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, etc.)

### Suggesting Features

We welcome feature suggestions! Please open an issue with:
- Clear description of the feature
- Use case and benefits
- Potential implementation approach

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
Make your changes
Follow existing code style
Add comments for complex logic
Update documentation if needed
Test your changes
npm run lint
npm run build
Commit with clear messages
git commit -m "feat: add new feature description"
Push and create PR
git push origin feature/your-feature-name
Development Setup
# Clone repository
git clone https://github.com/mohamedali170683-dotcom/ai-seo-analysis-platform.git
cd ai-seo-analysis-platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
Code Style
Use TypeScript for type safety
Follow existing patterns in the codebase
Use meaningful variable and function names
Add JSDoc comments for public APIs
Keep functions focused and small
Commit Message Convention
We use conventional commits:

feat: - New feature
fix: - Bug fix
docs: - Documentation changes
style: - Code style changes (formatting)
refactor: - Code refactoring
test: - Adding tests
chore: - Maintenance tasks
Example: feat: add Gemini API integration

Project Structure
ai-seo-analysis-platform/
├── app/              # Next.js pages and API routes
├── components/       # React components
├── lib/
│   ├── services/    # Business logic
│   ├── db/          # Database utilities
│   └── types/       # TypeScript types
└── prisma/          # Database schema
Testing
Before submitting:

Ensure code builds: npm run build
Check for linting errors: npm run lint
Test locally: npm run dev
Questions?
Feel free to open an issue for any questions!

Code of Conduct
Be respectful and inclusive
Focus on constructive feedback
Help others learn and grow
Keep discussions professional
Thank you for contributing! 🚀

