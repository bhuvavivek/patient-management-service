/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^#utils/(.*)\\.js$': '<rootDir>/src/utils/$1.ts',
    '^#middleware/(.*)\\.js$': '<rootDir>/src/middleware/$1.ts',
    '^#controllers/(.*)\\.js$': '<rootDir>/src/controllers/$1.ts',
    '^#models/(.*)\\.js$': '<rootDir>/src/models/$1.ts',
    '^#services/(.*)\\.js$': '<rootDir>/src/services/$1.ts',
    '^#config/(.*)\\.js$': '<rootDir>/src/config/$1.ts',
    '^#utils/(.*)$': '<rootDir>/src/utils/$1',
    '^#middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^#controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^#models/(.*)$': '<rootDir>/src/models/$1',
    '^#services/(.*)$': '<rootDir>/src/services/$1',
    '^#config/(.*)$': '<rootDir>/src/config/$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
