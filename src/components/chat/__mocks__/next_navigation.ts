// src/components/chat/__mocks__/next_navigation.ts
// OR place it in a global __mocks__/next/navigation.ts if preferred

export const useParams = jest.fn(() => ({ chatId: 'test-chat-id' }));
export const useSearchParams = jest.fn(() => new URLSearchParams());
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  // Add any other router methods your components might use
}));
export const usePathname = jest.fn(() => '/mock-path');
// Add other hooks if needed, e.g., useSelectedLayoutSegment

// If you are using App Router, you might also want to mock:
// export const Link = jest.fn(({ children, href }) => <a href={href}>{children}</a>);
// export const redirect = jest.fn();
// export const notFound = jest.fn();
