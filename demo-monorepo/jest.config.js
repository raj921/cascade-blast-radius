module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@auth/(.*)$': '<rootDir>/services/auth/$1',
    '^@billing/(.*)$': '<rootDir>/services/billing/$1',
    '^@notifications/(.*)$': '<rootDir>/services/notifications/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  collectCoverageFrom: [
    'services/**/*.ts',
    '!services/**/*.d.ts',
    '!services/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};

// Made with Bob
