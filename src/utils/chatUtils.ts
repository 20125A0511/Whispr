/**
 * Utility functions for managing temporary chat sessions
 */

/**
 * Generate a random chat ID
 * @returns {string} A random string to use as chat ID
 */
export function generateChatId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a unique chat URL that can be shared with others
 * @param {string} chatId The unique chat ID
 * @returns {string} The full URL that can be shared
 */
export function generateShareableLink(chatId: string): string {
  // Use window location in client components
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    return `${baseUrl}/chat/${chatId}`;
  }
  return '';
}

/**
 * Check if a chat session should be considered expired
 * @param {Date} lastActivity The timestamp of the last activity in the chat
 * @param {number} expiryMinutes How many minutes until a chat expires from inactivity
 * @returns {boolean} Whether the chat has expired
 */
export function isChatExpired(lastActivity: Date, expiryMinutes: number = 60): boolean {
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes > expiryMinutes;
} 