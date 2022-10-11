module.exports = {
    testEnvironment: './node_modules/jsdom',
    moduleDirectories: ['node_modules', 'src'],
    moduleNameMapper: {
        '.(css|less|scss)$': 'identity-obj-proxy',
        'components/(.*)': '<rootDir>/src/components/$1',
        'assets/(.*)': '<rootDir>/src/assets/$1',
    }
};