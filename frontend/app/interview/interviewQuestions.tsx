export const questions = [
    {
      id: 1,
      title: 'Handling Unsaved Changes in React Applications',
      description: 'How would you implement a warning system for unsaved changes in a React application? Consider both browser navigation and in-app navigation.',
      example: `<span class="text-[#569CD6]">const</span> <span class="text-[#4FC1FF]">UnsavedChangesHandler</span> = () => {
  <span class="text-[#569CD6]">const</span> [<span class="text-[#9CDCFE]">hasUnsavedChanges</span>, <span class="text-[#9CDCFE]">setHasUnsavedChanges</span>] = <span class="text-[#DCDCAA]">useState</span>(<span class="text-[#569CD6]">false</span>);

  <span class="text-[#DCDCAA]">useEffect</span>(() => {
    <span class="text-[#569CD6]">const</span> <span class="text-[#DCDCAA]">handleBeforeUnload</span> = (<span class="text-[#9CDCFE]">e</span>: <span class="text-[#4EC9B0]">BeforeUnloadEvent</span>) => {
      <span class="text-[#569CD6]">if</span> (hasUnsavedChanges) {
        e.<span class="text-[#DCDCAA]">preventDefault</span>();
        e.<span class="text-[#9CDCFE]">returnValue</span> = <span class="text-[#CE9178]">'Are you sure you want to leave without saving changes?'</span>;
        <span class="text-[#569CD6]">return</span> e.<span class="text-[#9CDCFE]">returnValue</span>;
      }
    };

    window.<span class="text-[#DCDCAA]">addEventListener</span>(<span class="text-[#CE9178]">'beforeunload'</span>, handleBeforeUnload);
    <span class="text-[#569CD6]">return</span> () => window.<span class="text-[#DCDCAA]">removeEventListener</span>(<span class="text-[#CE9178]">'beforeunload'</span>, handleBeforeUnload);
  }, [hasUnsavedChanges]);

  <span class="text-[#569CD6]">return</span> (
    <span class="text-[#808080]">&lt;form onChange={() => setHasUnsavedChanges(true)}&gt;</span>
      <span class="text-[#808080]">{/* form content */}</span>
    <span class="text-[#808080]">&lt;/form&gt;</span>
  );
};`,
      followUp: [
        'How would you handle this in a Next.js application with client-side navigation?',
        'What are the pros and cons of using the beforeunload event?',
        'How would you test this functionality?',
        'How would you handle multiple forms on the same page?',
        'What about handling unsaved changes in a SPA with React Router?',
        'How would you implement auto-save functionality?'
      ],
      sampleAnswer: `The implementation involves several key aspects:

1. State Management:
   - Track form changes using a boolean state
   - Update state on any form input change
   - Reset state after successful save

   Example:
   \`\`\`typescript
   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
   
   const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
     setHasUnsavedChanges(true);
     // Handle input change
   };
   
   const handleSave = async () => {
     await saveData();
     setHasUnsavedChanges(false);
   };
   \`\`\`

2. Browser Navigation:
   - Use the beforeunload event to show a warning
   - Prevent accidental navigation away
   - Handle cleanup properly in useEffect

   Example:
   \`\`\`typescript
   useEffect(() => {
     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
       if (hasUnsavedChanges) {
         e.preventDefault();
         e.returnValue = 'Are you sure you want to leave without saving changes?';
         return e.returnValue;
       }
     };

     window.addEventListener('beforeunload', handleBeforeUnload);
     return () => window.removeEventListener('beforeunload', handleBeforeUnload);
   }, [hasUnsavedChanges]);
   \`\`\`

3. In-app Navigation:
   - Use Next.js router events
   - Show custom confirmation dialog
   - Handle both allow and cancel cases

   Example:
   \`\`\`typescript
   const router = useRouter();
   
   useEffect(() => {
     const handleRouteChange = (url: string) => {
       if (hasUnsavedChanges) {
         const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
         if (!confirmed) {
           router.events.emit('routeChangeError');
           throw 'Route cancelled due to unsaved changes';
         }
       }
     };

     router.events.on('routeChangeStart', handleRouteChange);
     return () => router.events.off('routeChangeStart', handleRouteChange);
   }, [hasUnsavedChanges, router]);
   \`\`\`

4. Testing Strategy:
   - Unit test state management
   - Integration test navigation handling
   - E2E test user flows

   Example:
   \`\`\`typescript
   describe('UnsavedChangesHandler', () => {
     it('should show warning on navigation with unsaved changes', async () => {
       const { getByRole } = render(<FormComponent />);
       const input = getByRole('textbox');
       
       // Simulate changes
       fireEvent.change(input, { target: { value: 'new value' } });
       
       // Try to navigate
       const link = getByRole('link');
       fireEvent.click(link);
       
       // Check if warning is shown
       expect(window.confirm).toHaveBeenCalledWith(
         expect.stringContaining('unsaved changes')
       );
     });
   });
   \`\`\`

Best Practices:
- Always clean up event listeners
- Consider using a custom hook
- Handle edge cases (e.g., multiple tabs)
- Provide clear user feedback

Example of a custom hook:
\`\`\`typescript
const useUnsavedChanges = (initialValue = false) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(initialValue);
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave without saving changes?';
        return e.returnValue;
      }
    };

    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
        if (!confirmed) {
          router.events.emit('routeChangeError');
          throw 'Route cancelled due to unsaved changes';
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [hasUnsavedChanges, router]);

  return [hasUnsavedChanges, setHasUnsavedChanges];
};
\`\`\``
    },
    {
      id: 2,
      title: 'React Performance Optimization',
      description: 'How would you optimize the performance of a React application? Discuss different techniques and when to use them.',
      example: `<span class="text-[#569CD6]">const</span> <span class="text-[#4FC1FF]">OptimizedComponent</span> = <span class="text-[#DCDCAA]">React.memo</span>(({ <span class="text-[#9CDCFE]">data</span>, <span class="text-[#9CDCFE]">onClick</span> }) => {
  <span class="text-[#569CD6]">const</span> <span class="text-[#DCDCAA]">memoizedCallback</span> = <span class="text-[#DCDCAA]">useCallback</span>(() => {
    <span class="text-[#DCDCAA]">onClick</span>(data);
  }, [data, onClick]);

  <span class="text-[#569CD6]">const</span> <span class="text-[#DCDCAA]">memoizedValue</span> = <span class="text-[#DCDCAA]">useMemo</span>(() => {
    <span class="text-[#569CD6]">return</span> <span class="text-[#DCDCAA]">expensiveCalculation</span>(data);
  }, [data]);

  <span class="text-[#569CD6]">return</span> (
    <span class="text-[#808080]">&lt;div onClick={memoizedCallback}&gt;</span>
      {memoizedValue}
    <span class="text-[#808080]">&lt;/div&gt;</span>
  );
});`,
      followUp: [
        'When should you use React.memo vs useMemo?',
        'How do you identify performance bottlenecks?',
        'What tools do you use for performance profiling?',
        'How would you optimize a large list of items?',
        'What are the best practices for code splitting?',
        'How do you handle memory leaks in React?'
      ],
      sampleAnswer: `React performance optimization involves multiple strategies:

1. Component Optimization:
   - Use React.memo for pure components
   - Implement shouldComponentUpdate
   - Avoid unnecessary re-renders
   - Use proper key props

2. Hook Optimization:
   - useMemo for expensive calculations
   - useCallback for function stability
   - useRef for mutable values
   - Proper dependency arrays

3. Code Splitting:
   - Dynamic imports
   - Route-based splitting
   - Component lazy loading
   - Bundle analysis

4. State Management:
   - Local state optimization
   - Context optimization
   - Redux selectors
   - State normalization

5. Best Practices:
   - Virtualize long lists
   - Optimize images
   - Use production builds
   - Implement proper caching`
    },
    {
      id: 3,
      title: 'React Hooks Deep Dive',
      description: 'Explain the different types of React Hooks and their use cases. How do they work under the hood?',
      example: `<span class="text-[#569CD6]">const</span> <span class="text-[#4FC1FF]">CustomHookExample</span> = () => {
  <span class="text-[#569CD6]">const</span> [<span class="text-[#9CDCFE]">state</span>, <span class="text-[#9CDCFE]">setState</span>] = <span class="text-[#DCDCAA]">useState</span>(<span class="text-[#569CD6]">null</span>);
  <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">ref</span> = <span class="text-[#DCDCAA]">useRef</span>(<span class="text-[#569CD6]">null</span>);

  <span class="text-[#DCDCAA]">useEffect</span>(() => {
    <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">subscription</span> = <span class="text-[#DCDCAA]">subscribe</span>();
    <span class="text-[#569CD6]">return</span> () => <span class="text-[#DCDCAA]">subscription</span>.<span class="text-[#DCDCAA]">unsubscribe</span>();
  }, []);

  <span class="text-[#569CD6]">const</span> <span class="text-[#DCDCAA]">memoizedValue</span> = <span class="text-[#DCDCAA]">useMemo</span>(() => 
    <span class="text-[#DCDCAA]">computeExpensiveValue</span>(state), [state]
  );

  <span class="text-[#569CD6]">return</span> <span class="text-[#808080]">&lt;div ref={ref}&gt;{memoizedValue}&lt;/div&gt;</span>;
};`,
      followUp: [
        'What are the rules of Hooks?',
        'How do custom Hooks work?',
        'What are the common pitfalls with Hooks?',
        'How would you create a custom hook for API calls?',
        'What is the difference between useEffect and useLayoutEffect?',
        'How do you handle cleanup in useEffect?'
      ],
      sampleAnswer: `React Hooks are a powerful feature that requires deep understanding:

1. Core Hooks:
   - useState: State management
   - useEffect: Side effects
   - useContext: Context consumption
   - useReducer: Complex state logic
   - useRef: Mutable references

2. Additional Hooks:
   - useMemo: Memoized values
   - useCallback: Memoized functions
   - useLayoutEffect: Synchronous effects
   - useImperativeHandle: Custom refs
   - useDebugValue: Debug information

3. Custom Hooks:
   - Encapsulate reusable logic
   - Follow naming convention
   - Can use other hooks
   - Share stateful logic

4. Hook Rules:
   - Only call at top level
   - Only call in React functions
   - Follow dependency array rules
   - Handle cleanup properly

5. Best Practices:
   - Keep hooks focused
   - Proper error handling
   - Performance optimization
   - Testing strategies`
    },
    {
      id: 4,
      title: 'Next.js Server Components',
      description: 'Explain the concept of Server Components in Next.js. How do they differ from Client Components?',
      example: `<span class="text-[#808080]">// Server Component</span>
<span class="text-[#569CD6]">async</span> <span class="text-[#569CD6]">function</span> <span class="text-[#4FC1FF]">ServerComponent</span>() {
  <span class="text-[#569CD6]">try</span> {
    <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">data</span> = <span class="text-[#569CD6]">await</span> <span class="text-[#DCDCAA]">fetchData</span>();
    
    <span class="text-[#569CD6]">return</span> (
      <span class="text-[#808080]">&lt;Suspense fallback={&lt;LoadingSpinner /&gt;}&gt;</span>
        <span class="text-[#808080]">&lt;div&gt;</span>
          <span class="text-[#808080]">&lt;h1&gt;{data.title}&lt;/h1&gt;</span>
          <span class="text-[#808080]">&lt;ClientComponent data={data} /&gt;</span>
        <span class="text-[#808080]">&lt;/div&gt;</span>
      <span class="text-[#808080]">&lt;/Suspense&gt;</span>
    );
  } <span class="text-[#569CD6]">catch</span> (error) {
    <span class="text-[#569CD6]">return</span> <span class="text-[#808080]">&lt;ErrorFallback error={error} /&gt;</span>;
  }
}

<span class="text-[#808080]">// Client Component</span>
<span class="text-[#CE9178]">'use client'</span>;

<span class="text-[#569CD6]">const</span> <span class="text-[#4FC1FF]">ClientComponent</span> = ({ <span class="text-[#9CDCFE]">data</span> }) => {
  <span class="text-[#569CD6]">const</span> [<span class="text-[#9CDCFE]">state</span>, <span class="text-[#9CDCFE]">setState</span>] = <span class="text-[#DCDCAA]">useState</span>(<span class="text-[#569CD6]">null</span>);

  <span class="text-[#569CD6]">return</span> (
    <span class="text-[#808080]">&lt;div onClick={() => setState(data)}&gt;</span>
      {state?.content}
    <span class="text-[#808080]">&lt;/div&gt;</span>
  );
};`,
      followUp: [
        'When should you use Server Components?',
        'How do you handle client-side interactivity?',
        'What are the performance benefits?',
        'How do you handle errors in Server Components?',
        'What are the best practices for loading states?',
        'How do you implement authentication in Server Components?',
        'What about handling dynamic data in Server Components?',
        'How do you optimize Server Component performance?'
      ],
      sampleAnswer: `Server Components are a powerful Next.js feature:

1. Server Components:
   - Run on the server
   - Reduce client bundle size
   - Direct database access
   - Keep sensitive data server-side
   - Improved performance

2. Client Components:
   - Run in the browser
   - Handle interactivity
   - Use browser APIs
   - Manage client state
   - Handle user events

3. Error Handling:
   - Try-catch blocks in server components
   - Error boundaries at page and global levels
   - Graceful error fallbacks
   - User-friendly error messages
   - Proper error logging and tracking

4. Loading States:
   - Suspense boundaries for better UX
   - Loading states for initial page load
   - Loading states for data fetching
   - Progressive loading strategies
   - Skeleton screens for better UX

5. Performance Optimization:
   - Parallel data fetching
   - Proper caching strategies
   - Resource monitoring
   - Database connection optimization
   - Environment variable management

6. Best Practices:
   - Use Server Components by default
   - Add 'use client' when needed
   - Implement proper error handling
   - Use Suspense for loading states
   - Monitor server resources

7. Debugging and Monitoring:
   - Server log analysis
   - Error tracking
   - Performance monitoring
   - Resource usage tracking
   - API endpoint health checks

8. Implementation Strategy:
   - Start with Server Components
   - Add Client Components for interactivity
   - Implement proper error boundaries
   - Use Suspense for loading states
   - Monitor and optimize performance

Example of comprehensive error handling:
\`\`\`typescript
// Server Component with error handling
async function ServerComponent() {
  try {
    // Validate environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error('Database configuration missing');
    }

    // Fetch data with timeout
    const data = await Promise.race([
      fetchData(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
    ]);

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <ClientComponent data={data} />
        </ErrorBoundary>
      </Suspense>
    );
  } catch (error) {
    // Log error for debugging
    console.error('Server Component Error:', error);
    
    // Return user-friendly error
    return <ErrorFallback error={error} />;
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
\`\`\`

Example of loading state management:
\`\`\`typescript
// Loading state component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
}

// Data fetching with loading state
async function DataFetchingComponent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DataContent />
    </Suspense>
  );
}

// Parallel data fetching
async function DataContent() {
  const [data1, data2, data3] = await Promise.all([
    fetchData1(),
    fetchData2(),
    fetchData3()
  ]);

  return (
    <div>
      <Component1 data={data1} />
      <Component2 data={data2} />
      <Component3 data={data3} />
    </div>
  );
}
\`\`\``
    },
    {
      id: 5,
      title: 'React Testing Strategies',
      description: 'How would you approach testing a React application? Discuss different types of tests and testing tools.',
      example: `<span class="text-[#569CD6]">import</span> { <span class="text-[#9CDCFE]">render</span>, <span class="text-[#9CDCFE]">screen</span>, <span class="text-[#9CDCFE]">fireEvent</span> } <span class="text-[#569CD6]">from</span> <span class="text-[#CE9178]">'@testing-library/react'</span>;
<span class="text-[#569CD6]">import</span> <span class="text-[#9CDCFE]">userEvent</span> <span class="text-[#569CD6]">from</span> <span class="text-[#CE9178]">'@testing-library/user-event'</span>;

<span class="text-[#569CD6]">describe</span>(<span class="text-[#CE9178]">'FormComponent'</span>, () => {
  <span class="text-[#569CD6]">it</span>(<span class="text-[#CE9178]">'handles form submission'</span>, <span class="text-[#569CD6]">async</span> () => {
    <span class="text-[#DCDCAA]">render</span>(<span class="text-[#808080]">&lt;FormComponent /&gt;</span>);
    
    <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">input</span> = <span class="text-[#DCDCAA]">screen</span>.<span class="text-[#DCDCAA]">getByRole</span>(<span class="text-[#CE9178]">'textbox'</span>);
    <span class="text-[#569CD6]">await</span> <span class="text-[#DCDCAA]">userEvent</span>.<span class="text-[#DCDCAA]">type</span>(input, <span class="text-[#CE9178]">'test'</span>);
    
    <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">button</span> = <span class="text-[#DCDCAA]">screen</span>.<span class="text-[#DCDCAA]">getByRole</span>(<span class="text-[#CE9178]">'button'</span>);
    <span class="text-[#569CD6]">await</span> <span class="text-[#DCDCAA]">userEvent</span>.<span class="text-[#DCDCAA]">click</span>(button);
    
    <span class="text-[#569CD6]">expect</span>(<span class="text-[#DCDCAA]">screen</span>.<span class="text-[#DCDCAA]">getByText</span>(<span class="text-[#CE9178]">'Success'</span>)).<span class="text-[#DCDCAA]">toBeInTheDocument</span>();
  });
});`,
      followUp: [
        'What testing libraries do you use?',
        'How do you test async code?',
        'Whats your approach to mocking?',
        'How do you test custom hooks?',
        'What about testing error boundaries?',
        'How do you set up testing environment?',
        'What tools do you use for E2E testing?'
      ],
      sampleAnswer: `React testing requires a comprehensive approach:

1. Testing Types:
   - Unit tests for components
   - Integration tests for features
   - End-to-end tests for flows
   - Performance tests
   - Accessibility tests

2. Testing Libraries:
   - Jest for test runner
   - React Testing Library
   - Cypress for E2E
   - MSW for API mocking
   - Playwright for browser testing

3. Testing Strategies:
   - Test user interactions
   - Test component rendering
   - Test state changes
   - Test error handling
   - Test accessibility

4. Best Practices:
   - Write meaningful tests
   - Follow testing pyramid
   - Use proper assertions
   - Implement proper mocking
   - Maintain test coverage

5. Testing Tools:
   - Jest for unit testing
   - React Testing Library for component testing
   - Cypress for E2E testing
   - MSW for API mocking
   - Playwright for browser testing`
    },
    {
      id: 6,
      title: 'Comprehensive Error Handling in Fullstack Applications',
      description: 'How should errors be handled in both frontend and backend applications? Discuss best practices for HTTP status codes, user feedback, and error boundaries.',
      example: `// Express.js backend error handling
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal Server Error' });
});

// React frontend error boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div>Something went wrong.</div>;
    return this.props.children;
  }
}`,
      followUp: [
        'What HTTP status codes should be used for validation errors, not found, and server errors?',
        'How do you display backend errors to users in a user-friendly way?',
        'What is the role of error boundaries in React?'
      ],
      sampleAnswer: `Errors should be handled gracefully on both frontend and backend. The backend should return appropriate HTTP status codes (e.g., 400 for validation errors, 404 for not found, 500 for server errors) and clear error messages. The frontend should catch these errors, display user-friendly messages, and use error boundaries to prevent the app from crashing.`
    },
    {
      id: 7,
      title: 'Data Validation on Frontend and Backend',
      description: 'Why is it important to validate user input on both the frontend and backend? How would you implement validation in a fullstack application?',
      example: `// Frontend validation (React)
const [error, setError] = useState('');
const handleSubmit = (e) => {
  if (!email) {
    setError('Email is required');
    return;
  }
  // submit form
};

// Backend validation (Express)
app.post('/api/user', (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  // save user
});`,
      followUp: [
        'What are the security risks of relying only on frontend validation?',
        'How do you handle validation errors returned from the backend?',
        'What libraries do you use for validation?'
      ],
      sampleAnswer: `Frontend validation improves user experience by providing instant feedback, but backend validation is essential for security and data integrity. Both should be implemented.`
    },
    {
      id: 8,
      title: 'HTTP Status Codes and API Design',
      description: 'What are the most important HTTP status codes to know when designing APIs? Give examples of when to use 400, 404, and 500.',
      example: `// Express.js
res.status(400).json({ message: 'Bad Request' }); // Invalid input
res.status(404).json({ message: 'Not Found' });   // Resource not found
res.status(500).json({ message: 'Internal Server Error' }); // Server error`,
      followUp: [
        'What status code should you return for unauthorized access?',
        'What about for successful creation of a resource?',
        'How do you document your API error responses?'
      ],
      sampleAnswer: `400 is for client errors like validation, 404 for missing resources, 500 for server errors. Use 401 for unauthorized, 201 for successful creation.`
    },
    {
      id: 9,
      title: 'Testing Validation and Error Handling',
      description: 'How do you test validation logic and error handling in frontend and backend applications?',
      example: `// Frontend (React Testing Library)
it('shows error on empty input', () => {
  render(<Form />);
  fireEvent.click(screen.getByText('Submit'));
  expect(screen.getByText('Email is required')).toBeInTheDocument();
});

// Backend (Jest + Supertest)
it('returns 400 for missing email', async () => {
  await request(app).post('/api/user').send({}).expect(400);
});`,
      followUp: [
        'How do you mock backend errors in frontend tests?',
        'How do you test error boundaries in React?',
        'What tools do you use for backend integration tests?'
      ],
      sampleAnswer: `Write unit and integration tests for both frontend and backend. Use tools like React Testing Library, Jest, and Supertest. Mock errors and assert correct handling and messaging.`
    },
    {
      id: 10,
      title: 'Code Quality and Clean Code Principles',
      description: 'What are some best practices for writing clean, maintainable code? How do you ensure code readability and avoid common pitfalls?',
      example: `// Good variable names, no magic numbers, no commented-out code
const MAX_USERS = 100;
function isUserLimitReached(count) {
  return count >= MAX_USERS;
}`,
      followUp: [
        'What are magic numbers and why should you avoid them?',
        'How do you keep your codebase clean and organized?',
        'What is the SOLID principle?'
      ],
      sampleAnswer: `Use meaningful names, avoid magic numbers, remove unused code, follow SOLID principles, and keep functions short and focused.`
    },
    {
      id: 3,
      title: 'Testing Custom Hooks with Jest & React Testing Library',
      description: 'How would you test a custom React hook that fetches data? Discuss strategies for mocking, rendering, and asserting hook behavior.',
      example: `import { renderHook, act } from '@testing-library/react-hooks';
    import { useFetchData } from '../hooks/useFetchData';
    import fetchMock from 'jest-fetch-mock';
    
    fetchMock.enableMocks();
    
    beforeEach(() => {
      fetchMock.resetMocks();
    });
    
    it('should return data and loading states correctly', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ items: [1,2,3] }));
    
      const { result, waitForNextUpdate } = renderHook(() => useFetchData('/api/items'));
    
      expect(result.current.loading).toBe(true);
    
      await waitForNextUpdate();
    
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({ items: [1,2,3] });
      expect(result.current.error).toBeNull();
    });`,
      followUp: [
        'How do you handle cleanup when testing hooks with timers or subscriptions?',
        'What\'s the difference between mocking fetch vs axios in tests?',
        'How would you test error states in your hook?',
        'How do you test async operations in custom hooks?',
        'What about testing hooks with context?'
      ],
      sampleAnswer: `To test a custom hook that fetches data, I'd:
    1. **Mock the network layer** (e.g. jest-fetch-mock or msw) so tests don't hit real APIs.
    2. **Use \`renderHook\`** from React Testing Library to mount the hook in isolation.
    3. **Assert initial state** (e.g. \`loading: true\`).
    4. **Wait for updates** using \`waitForNextUpdate\` or \`waitFor\`.
    5. **Assert final state** (data matches mock, loading false, no error).
    6. **Test edge cases**: network errors, empty responses, cleanup (using fake timers or unmount).`
    },
    {
      id: 4,
      title: 'Next.js Incremental Static Regeneration (ISR)',
      description: 'Explain how Incremental Static Regeneration works in Next.js. When would you use it vs Static Generation or Server-Side Rendering?',
      example: `// pages/posts/[id].tsx
    export async function getStaticPaths() {
      return { paths: [], fallback: 'blocking' }
    }
    
    export async function getStaticProps({ params }) {
      const post = await fetchPost(params.id);
      return {
        props: { post },
        revalidate: 60, // regenerate at most once per minute
      };
    }
    
    export default function PostPage({ post }) {
      return <article>{post.content}</article>;
    }`,
      followUp: [
        'What happens when a user requests a page that\'s expired according to revalidate?',
        'How do you handle preview mode with ISR?',
        'Can you combine ISR with API routes?',
        'How do you handle dynamic routes with ISR?',
        'What are the limitations of ISR?'
      ],
      sampleAnswer: `ISR lets you serve static pages and update them in the background.  
    - **getStaticProps** with a \`revalidate\` interval tells Next.js to regenerate the page after it's older than that.  
    - **fallback: 'blocking'** makes the first visitor wait for generation, then caches it.  
    Use ISR for content that updates periodically (blog posts, dashboards) without rebuilding the entire site.  
    For per-request fresh data or personalized content, choose SSR; for never-changing assets, use pure SSG.`
    },
    {
      id: 5,
      title: 'TypeScript Generics for Reusable Components',
      description: 'How do generics help in creating reusable TypeScript components or functions? Provide an example of a generic component.',
      example: `interface ListProps<T> {
      items: T[];
      renderItem: (item: T) => React.ReactNode;
    }
    
    function List<T>({ items, renderItem }: ListProps<T>) {
      return (
        <ul>
          {items.map((item, idx) => (
            <li key={idx}>{renderItem(item)}</li>
          ))}
        </ul>
      );
    }
    
    // Usage:
    <List<number>
      items={[1,2,3]}
      renderItem={n => <strong>{n}</strong>}
    />;`,
      followUp: [
        'What are key constraints you can apply to generic types?',
        'How do you infer generic types from function arguments?',
        'When might you avoid generics in favor of union types?'
      ],
      sampleAnswer: `Generics let you write code that works across many types while preserving type safety.  
    - Define a type parameter \`<T>\` on interfaces or functions.  
    - Use \`T\` inside props or return types so the compiler knows exactly which type you're working with.  
    Constraints (\`T extends U\`) allow you to limit generics to types with certain properties.  
    Generics shine in data structures (lists, maps), abstractions (hooks), and utility functions without sacrificing IntelliSense.`
    },
    {
      id: 6,
      title: 'useEffect Cleanup and Dependency Pitfalls',
      description: 'Describe how the cleanup function in \`useEffect\` works. What common mistakes lead to stale closures or memory leaks?',
      example: `useEffect(() => {
      const id = setInterval(() => {
        console.log('Tick');
      }, 1000);
    
      return () => {
        clearInterval(id);
      };
    }, []); // cleanup on unmount`,
      followUp: [
        'What happens if you omit the dependency array entirely?',
        'How do you avoid stale state inside effects?',
        'When would you use \`useLayoutEffect\` instead?'
      ],
      sampleAnswer: `The function returned from \`useEffect\` runs before the next effect or on unmount—ideal for clearing timers, subscriptions, or DOM listeners.  
    Common pitfalls:  
    1. **Omitted deps**: effect runs every render, cleanup runs each time → potential rapid mount/unmount.  
    2. **Stale closures**: capturing old state or props; solution: include all necessary dependencies or use refs.  
    3. **Memory leaks**: forgetting cleanup (e.g. websockets) leads to orphaned listeners.  
    Use \`useLayoutEffect\` for synchronously reading/writing the DOM before paint.`
    }
    
    
  ];