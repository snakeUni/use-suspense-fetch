module.exports = {
  roots: ['<rootDir>/tests'],
  testRegex: 'tests/(.+)\\.test\\.(jsx?|tsx?)$',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testEnvironmentOptions: {
    runScripts: 'dangerously'
  },
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  testPathIgnorePatterns: ['/node_modules/', '/lib/', '/es/'],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}
