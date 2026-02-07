# Frontend Setup Quick Start

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Code Quality

Run ESLint:
```bash
npm run lint
```

## Quick Examples

### Using the API Client

```typescript
import { api } from "@/lib/api"

// Get all courses
const courses = await api.getCourses()

// Create a new course
const newCourse = await api.createCourse({
  title: "Introduction to RAG",
  description: "Learn about Retrieval-Augmented Generation",
  instructor_id: 1
})
```

### Using Authentication

```typescript
"use client"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { login, isAuthenticated, loading, error } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      router.push('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  if (isAuthenticated) {
    router.push('/dashboard')
    return null
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  )
}
```

### Using UI Components

```typescript
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui"
import { useToast } from "@/lib/use-toast"

export default function MyComponent() {
  const { toast } = useToast()

  const handleClick = () => {
    toast({
      title: "Success!",
      description: "Your action was completed.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleClick}>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

## Available Components

All components are exported from `@/components/ui`:
- `Button` - with variants: default, destructive, outline, secondary, ghost, link
- `Input` - text input
- `Textarea` - multi-line text input
- `Card` - container with header, content, footer
- `Dialog` - modal dialog
- `Select` - dropdown select
- `Badge` - status/label badge
- `Toast` / `Toaster` - notifications
- `Spinner` - loading indicator

## Project Structure

```
frontend/
├── app/                 # Next.js app directory
├── components/
│   └── ui/             # Base UI components
├── lib/                # Utilities and hooks
│   ├── api.ts         # API client
│   ├── auth.ts        # Auth utilities
│   ├── utils.ts       # Helper functions
│   └── use-toast.ts   # Toast hook
├── .env.local         # Environment variables (create this)
└── COMPONENTS.md      # Detailed component documentation
```

## TypeScript

All code is fully typed. Import types from the API client:

```typescript
import { User, Course, Lesson, ChatRequest, ChatResponse } from "@/lib/api"
```

## Next Steps

1. Review `COMPONENTS.md` for detailed component documentation
2. Check out the API types in `lib/api.ts`
3. See the authentication flow in `lib/auth.ts`
4. Start building your pages in the `app/` directory

## Support

For detailed documentation, see:
- `COMPONENTS.md` - Component usage guide
- `lib/api.ts` - API endpoints and types
- `lib/auth.ts` - Authentication system
