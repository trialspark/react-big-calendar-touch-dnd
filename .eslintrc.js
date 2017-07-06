module.exports = {
  "extends": ["eslint:recommended", "eslint-config-airbnb"],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true,
    }
  },
  "rules": {
    "import/no-extraneous-dependencies": [
      "error",
      { "devDependencies": ["**/*.spec.jsx", "**/setup.karma.js", "**/example/**", "**/webpack.config.js"] }
    ],
    "no-underscore-dangle": 0,
  },
  "env": {
    "browser": true,
    "jasmine": true,
  }
}
