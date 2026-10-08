// Database integration suites run separately against an explicitly isolated DB.
module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/calendar/**/*.spec.ts', '<rootDir>/src/market-ranking/**/*.spec.ts', '<rootDir>/src/news/**/*.spec.ts'],
    transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: {
        module: 'commonjs', target: 'ES2021', esModuleInterop: false,
        experimentalDecorators: true, emitDecoratorMetadata: true,
        skipLibCheck: true, types: ['node', 'jest'],
    } }] },
};
