# 🤝 Contributing to E-Learning RAG Platform

Thank you for your interest in contributing to the E-Learning RAG Platform! This document provides guidelines and information for contributors.

## 📊 Current Project Status

**Phase:** Initial Planning  
**Implementation Status:** 0% Complete

The project is currently in the planning phase. We're setting up the foundation and welcoming contributors to help build this platform from the ground up.

## 🎯 How to Contribute

### For Developers

#### 1. Choose a Phase to Work On
See [ROADMAP.md](ROADMAP.md) for the complete development plan. Current priority:
- **Phase 1:** Project structure and Docker setup
- **Phase 2:** Backend foundation with authentication

#### 2. Set Up Development Environment

Once Phase 1 is complete, the setup will be:
```bash
# Clone the repository
git clone https://github.com/phu024/elearning-rag-platform.git
cd elearning-rag-platform

# Copy environment template
cp .env.example .env

# Start services with Docker Compose
docker-compose up -d

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install AI service dependencies
cd ../ai-service
pip install -r requirements.txt
```

> ⚠️ **Note:** The above steps will work once initial implementation is complete.

#### 3. Pick an Issue or Task
- Check the [Issues](https://github.com/phu024/elearning-rag-platform/issues) page
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to claim it

#### 4. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

#### 5. Make Your Changes
- Follow the code style guidelines (see below)
- Write tests for your code
- Keep commits focused and atomic
- Write clear commit messages

#### 6. Submit a Pull Request
- Push your branch to GitHub
- Create a Pull Request with a clear description
- Link any related issues
- Wait for code review

### For Designers

We need help with:
- UI/UX design for admin panel
- Learner portal interface design
- AI chatbot interface design
- Logo and branding
- Icon sets

### For Documentation Writers

Help improve:
- API documentation
- User guides
- Installation instructions
- Architecture documentation
- Code comments

### For Testers

Once implementation starts:
- Test new features
- Report bugs with detailed reproduction steps
- Suggest improvements
- Test on different platforms and browsers

## 📝 Code Style Guidelines

### TypeScript/JavaScript (Frontend & Backend)

```typescript
// Use TypeScript strict mode
// Use async/await over promises
// Use proper typing, avoid 'any'

// Good
async function fetchUser(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  return user;
}

// Bad
async function fetchUser(id: any): Promise<any> {
  return userRepository.findById(id);
}
```

**Rules:**
- Use ESLint and Prettier
- 2 spaces for indentation
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Follow Airbnb style guide

### Python (AI Service)

```python
# Use type hints
# Follow PEP 8
# Use docstrings

# Good
def process_document(file_path: str, file_type: str) -> ProcessingResult:
    """
    Process a document and extract text.
    
    Args:
        file_path: Path to the document file
        file_type: Type of the document (pdf, docx, etc.)
    
    Returns:
        ProcessingResult containing extracted text and metadata
    """
    # Implementation
    pass

# Bad
def process_document(file_path, file_type):
    # Implementation
    pass
```

**Rules:**
- Use Black for formatting
- Use mypy for type checking
- Use pylint for linting
- Follow PEP 8 style guide
- Add type hints to all functions

### Git Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(backend): add user authentication with JWT

fix(ai-service): correct PDF text extraction encoding

docs(readme): update installation instructions

refactor(frontend): improve chatbot component structure
```

## 🧪 Testing Guidelines

### Backend Tests
- Use Jest for unit and integration tests
- Aim for 80%+ code coverage
- Test all API endpoints
- Mock external dependencies

```typescript
describe('User API', () => {
  it('should create a new user', async () => {
    const userData = { email: 'test@example.com', password: 'password123' };
    const response = await request(app)
      .post('/api/users')
      .send(userData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### AI Service Tests
- Use pytest for testing
- Test each processing pipeline
- Mock ML models for faster tests
- Test edge cases

```python
def test_pdf_processor():
    processor = PDFProcessor()
    result = processor.process("test.pdf")
    
    assert result.success is True
    assert len(result.text) > 0
    assert result.pages > 0
```

### Frontend Tests
- Use Jest + React Testing Library
- Test components in isolation
- Test user interactions
- Test integration with API

```typescript
test('renders login form', () => {
  render(<LoginForm />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});
```

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] No console.log or debug statements
- [ ] PR description explains the changes
- [ ] Related issues are linked
- [ ] Commits are properly formatted

## 🔍 Code Review Process

1. **Automated Checks**
   - Linting passes
   - Tests pass
   - Build succeeds
   - No security vulnerabilities

2. **Manual Review**
   - Code quality
   - Adherence to guidelines
   - Test coverage
   - Documentation

3. **Approval & Merge**
   - At least one approval required
   - Merge conflicts resolved
   - Squash and merge (unless specified)

## 🌟 Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in the README

## 📞 Getting Help

- **Questions?** Open a [Discussion](https://github.com/phu024/elearning-rag-platform/discussions)
- **Bug Report?** Open an [Issue](https://github.com/phu024/elearning-rag-platform/issues)
- **Feature Idea?** Open an [Issue](https://github.com/phu024/elearning-rag-platform/issues) with the `enhancement` label

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## 🚀 Let's Build Together!

We're excited to have you contribute to this project. Whether you're fixing bugs, adding features, improving documentation, or suggesting ideas, every contribution matters!

**Ready to start?** Check out the [ROADMAP.md](ROADMAP.md) and pick a task that interests you!

---

*Last Updated: February 7, 2026*
