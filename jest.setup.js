// Optional: configure or set up a testing framework before each test
// Jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

// Mock IntersectionObserver
class IntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});


// Mock window.matchMedia
global.matchMedia = query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // deprecated
  removeListener: jest.fn(), // deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

// Mock supabase client if it's used globally or in ways not easily injectable
// This is a very basic mock. Adjust if specific Supabase features are needed.
jest.mock('@/utils/supabase', () => ({
  supabase: {
    channel: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(() => ({
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    // Add other Supabase methods used in your components if necessary
    auth: {
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      // Mock other auth methods if needed
    },
  },
}));

// Mock Logo component as it might involve <Image> from next/image or complex SVG logic not relevant to unit tests
jest.mock('@/components/ui/Logo', () => {
  return function DummyLogo(props: any) {
    return <div data-testid="logo-mock">Logo</div>;
  };
});

// Mock ShareChat component
jest.mock('@/components/chat/ShareChat', () => {
  return function DummyShareChat(props: any) {
    return <div data-testid="share-chat-mock">Share Chat Options</div>;
  };
});

// Mock emoji-picker-react
jest.mock('emoji-picker-react', () => {
  const Picker = ({ onEmojiClick }: { onEmojiClick: (emoji: { emoji: string }) => void }) => (
    <div data-testid="emoji-picker-mock">
      <button onClick={() => onEmojiClick({ emoji: '😊' })}>MockEmoji</button>
    </div>
  );
  return {
    __esModule: true, // This is important for ES6 modules
    default: Picker, // Assuming Picker is the default export
    // Mock other exports if ChatInterface uses them (e.g., EmojiClickData, Theme)
  };
});
