module.exports = {
    // Indicates that the test environment is Node.js
    testEnvironment: 'node',
  
    // The root directory that Jest should scan for tests and modules within
    roots: ['<rootDir>/src'],
  
    // A list of file extensions that Jest should look for
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
    // Transform TypeScript files before running tests
    transform: {
      '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    },
  
    // Path mappings for modules, particularly useful for resolving TypeScript paths
    moduleNameMapper: {
      '^~lib/(.*)$': '<rootDir>/src/lib/$1',
    },
  
    // Test Regex pattern to find test files
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  
    // Ignore build and output directories from scanning
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
    // Coverage report settings
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
  };
  