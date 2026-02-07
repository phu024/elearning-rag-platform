# Frontend Utilities and Components

This document provides an overview of the frontend utilities and base components created for the e-learning RAG platform.

## Directory Structure

```
frontend/
├── lib/
│   ├── utils.ts         # Utility functions (Tailwind class merging)
│   ├── api.ts           # API client with axios
│   ├── auth.ts          # Authentication utilities and hooks
│   └── use-toast.ts     # Toast notification hook
├── components/ui/
│   ├── button.tsx       # Button component
│   ├── input.tsx        # Input component
│   ├── card.tsx         # Card component
│   ├── dialog.tsx       # Dialog/Modal component
│   ├── select.tsx       # Select dropdown component
│   ├── textarea.tsx     # Textarea component
│   ├── badge.tsx        # Badge component
│   ├── toast.tsx        # Toast notification component
│   ├── toaster.tsx      # Toast container component
│   └── spinner.tsx      # Loading spinner
├── env.d.ts             # Environment variable type definitions
└── .env.local.example   # Example environment variables
```

## Utilities

### lib/utils.ts
Utility functions for the application.

**Functions:**
- `cn(...inputs)` - Merges Tailwind CSS classes using clsx and tailwind-merge

**Example:**
```typescript
import { cn } from "@/lib/utils"

const className = cn("text-base", { "font-bold": isActive }, "text-red-500")
```

### lib/api.ts
API client using axios with authentication and interceptors.

**Features:**
- Axios instance with base URL from environment variables
- Automatic token injection from localStorage
- Request/response interceptors
- Automatic redirect to login on 401 errors
- TypeScript types for all API entities

**API Methods:**
- **Auth**: `login()`, `register()`, `getCurrentUser()`
- **Users**: `getUsers()`, `getUser()`, `updateUser()`, `deleteUser()`
- **Courses**: `getCourses()`, `getCourse()`, `createCourse()`, `updateCourse()`, `deleteCourse()`
- **Lessons**: `getLessons()`, `getLesson()`, `createLesson()`, `updateLesson()`, `deleteLesson()`
- **Files**: `getFiles()`, `uploadFile()`, `deleteFile()`
- **Chat**: `sendChatMessage()`, `getChatHistory()`
- **Progress**: `getProgress()`, `markLessonComplete()`, `markLessonIncomplete()`

**Example:**
```typescript
import { api } from "@/lib/api"

// Login
const response = await api.login({ username, password })

// Get courses
const courses = await api.getCourses()

// Send chat message
const chatResponse = await api.sendChatMessage({
  message: "What is RAG?",
  course_id: 1
})
```

### lib/auth.ts
Authentication utilities and React hooks.

**Functions:**
- `getToken()` - Get auth token from localStorage
- `setToken(token)` - Store auth token in localStorage
- `removeToken()` - Remove auth token from localStorage
- `getCurrentUser()` - Get cached user from localStorage
- `setCurrentUser(user)` - Store user in localStorage
- `isAuthenticated()` - Check if user is authenticated

**Hook:**
- `useAuth()` - React hook for authentication state management

**useAuth Hook Returns:**
```typescript
{
  user: User | null,
  loading: boolean,
  error: string | null,
  isAuthenticated: boolean,
  login: (username, password) => Promise<User>,
  register: (username, email, password, fullName?) => Promise<User>,
  logout: () => void,
  refreshUser: () => Promise<User>
}
```

**Example:**
```typescript
import { useAuth } from "@/lib/auth"

function LoginPage() {
  const { login, loading, error, isAuthenticated } = useAuth()
  
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await login(username, password)
      router.push('/dashboard')
    } catch (err) {
      console.error('Login failed')
    }
  }
  
  return (
    // Your login form
  )
}
```

### lib/use-toast.ts
Toast notification system.

**Functions:**
- `toast({ title, description, variant })` - Show a toast notification
- `useToast()` - React hook for toast management

**Example:**
```typescript
import { useToast } from "@/lib/use-toast"

function MyComponent() {
  const { toast } = useToast()
  
  const showSuccess = () => {
    toast({
      title: "Success",
      description: "Your changes have been saved.",
    })
  }
  
  const showError = () => {
    toast({
      title: "Error",
      description: "Something went wrong.",
      variant: "destructive"
    })
  }
  
  return (
    // Your component
  )
}
```

## UI Components

All UI components follow shadcn/ui patterns and use Tailwind CSS for styling.

### Button
Versatile button component with multiple variants and sizes.

**Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`  
**Sizes:** `default`, `sm`, `lg`, `icon`

**Example:**
```typescript
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="outline" size="sm">Small button</Button>
<Button variant="destructive">Delete</Button>
```

### Input
Text input component with consistent styling.

**Example:**
```typescript
import { Input } from "@/components/ui/input"

<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
```

### Card
Container component for content grouping.

**Components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

**Example:**
```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>
```

### Dialog
Modal dialog component using Radix UI.

**Components:** `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`

**Example:**
```typescript
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content goes here</p>
    <DialogFooter>
      <Button>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Select
Dropdown select component using Radix UI.

**Components:** `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`

**Example:**
```typescript
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### Textarea
Multi-line text input component.

**Example:**
```typescript
import { Textarea } from "@/components/ui/textarea"

<Textarea placeholder="Enter your message" rows={4} />
```

### Badge
Small status or label component.

**Variants:** `default`, `secondary`, `destructive`, `outline`

**Example:**
```typescript
import { Badge } from "@/components/ui/badge"

<Badge>New</Badge>
<Badge variant="secondary">In Progress</Badge>
<Badge variant="destructive">Error</Badge>
```

### Toast & Toaster
Notification system using Radix UI Toast.

**Setup:**
Add the `Toaster` component to your root layout:

```typescript
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Usage:**
```typescript
import { useToast } from "@/lib/use-toast"

const { toast } = useToast()

toast({
  title: "Notification",
  description: "This is a toast notification",
})
```

### Spinner
Loading spinner component.

**Sizes:** `sm`, `md`, `lg`

**Example:**
```typescript
import { Spinner } from "@/components/ui/spinner"

<Spinner size="md" />
```

## Environment Variables

Create a `.env.local` file based on `.env.local.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## TypeScript Support

All components and utilities are fully typed with TypeScript. The API client includes comprehensive type definitions for:
- User
- Course
- Lesson
- File
- ChatMessage
- Progress
- Request/Response types

## Dependencies

The following dependencies are used:
- `axios` - HTTP client
- `@radix-ui/react-dialog` - Dialog component primitives
- `@radix-ui/react-select` - Select component primitives
- `@radix-ui/react-toast` - Toast component primitives
- `@radix-ui/react-slot` - Component composition
- `class-variance-authority` - Variant styling
- `clsx` - Conditional classnames
- `tailwind-merge` - Tailwind class merging
- `lucide-react` - Icon library

## Best Practices

1. **Import paths**: Use the `@/` alias for imports (e.g., `@/lib/utils`)
2. **API calls**: Always handle errors with try-catch blocks
3. **Authentication**: Use the `useAuth` hook in components that need auth state
4. **Toast notifications**: Use for user feedback on actions
5. **Loading states**: Use the Spinner component or loading prop on buttons
6. **Form validation**: Implement client-side validation before API calls

## Next Steps

To build upon these components:
1. Add a form validation library (e.g., react-hook-form, zod)
2. Create higher-level feature components (LoginForm, CourseCard, etc.)
3. Implement protected route wrapper components
4. Add loading and error boundary components
5. Create a navigation/layout system
