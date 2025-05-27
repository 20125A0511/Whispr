module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle CSS imports (if you have them)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    // Alias for @/ components
    '^@/(.*)$': '<rootDir>/src/$1',
    // Force react-icons to be treated as CJS
    '^react-icons/(.*)$': '<rootDir>/node_modules/react-icons/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  // Ignore Next.js specific files from transform
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
    '/.next/',
  ],
  // Necessary for react-icons to work with Jest
  // as it uses ES modules which Jest doesn't handle well by default for some packages
  // This ensures react-icons/* modules are transformed by ts-jest.
  // Adjust if react-icons structure changes or if other ESM packages cause issues.
  // Update: Added specific mapping for react-icons above, this might be redundant or could be more general.
  // For now, keeping the specific moduleNameMapper for react-icons.
};
