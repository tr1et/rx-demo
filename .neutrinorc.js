const path = require('path');

module.exports = {
  options: {
    tests: 'src',
  },
  use: [
    [
      '@neutrinojs/airbnb',
      {
        eslint: {
          rules: {
            'import/extensions': 0,
            'import/no-unresolved': 0,
            'import/no-extraneous-dependencies': 0,
            'import/prefer-default-export': 0,
            'function-paren-newline': ['error', 'multiline'],
            'object-curly-newline': ['error', { multiline: true }],
            'no-underscore-dangle': ['error', { allowAfterThis: true, allowAfterSuper: true }],
            'comma-dangle': [
              'error',
              {
                arrays: 'always-multiline',
                objects: 'always-multiline',
                imports: 'always-multiline',
                exports: 'always-multiline',
                functions: 'never',
              },
            ],
          },
        },
      },
    ],
    [
      '@neutrinojs/react',
      {
        html: {
          title: 'rx-demo',
        },
      },
    ],
    [
      '@neutrinojs/jest',
      {
        setupTestFrameworkScriptFile: '<rootDir>/configs/tests/setup-framework.js',
        setupFiles: ['<rootDir>/configs/tests/setup-environment.js'],
        coverageDirectory: path.resolve(__dirname, 'coverage'),
        snapshotSerializers: ['jest-serializer-html'],
      },
    ],
    [
      '@neutrinojs/stylelint',
      {
        pluginId: 'stylelint',
        files: '**/*.+(css|scss|sass|less)',
      },
    ],
    [
      '@neutrinojs/style-loader',
      {
        test: /\.s?css$/,
        loaders: [
          // Define loaders as objects
          {
            loader: 'sass-loader',
            useId: 'sass',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
    '@neutrinojs/image-loader',
    neutrino => {
      neutrino.config.resolve.modules
        .add(path.resolve(__dirname, 'src'))
        .add(path.resolve(__dirname, 'configs'));
    },
  ],
  env: {
    NODE_ENV: {
      production: {
        use: ['@neutrinojs/pwa'],
      },
    },
  },
};
