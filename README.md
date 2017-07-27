# StoreFront recommendations

StoreFront `<gb-recommendations>` component

[![npm (scoped with tag)](https://img.shields.io/npm/v/@storefront/recommendations.svg?style=flat-square)](https://www.npmjs.com/package/@storefront/recommendations)
[![CircleCI branch](https://img.shields.io/circleci/project/github/groupby/storefront-recommendations/master.svg?style=flat-square)](https://circleci.com/gh/groupby/storefront-recommendations/tree/master)
[![Codecov branch](https://img.shields.io/codecov/c/github/groupby/storefront-recommendations/master.svg?style=flat-square)](https://codecov.io/gh/groupby/storefront-recommendations)
[![bitHound](https://img.shields.io/bithound/code/github/groupby/storefront-recommendations.svg?style=flat-square)](https://www.bithound.io/github/groupby/storefront-recommendations)
[![bitHound](https://img.shields.io/bithound/dependencies/github/groupby/storefront-recommendations.svg?style=flat-square)](https://www.bithound.io/github/groupby/storefront-recommendations)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?style=flat-square)](https://choosealicense.com/licenses/mit/)
[![Greenkeeper badge](https://badges.greenkeeper.io/groupby/storefront-recommendations.svg)](https://greenkeeper.io/)

## Getting Started

This module requires [`@storefront/core`](https://www.npmjs.com/package/@storefront/core) for the component to render
and receive data from GroupBy microservices.

### Prerequisites

This module is meant to be used in a `node` environment which is bundled for use in the browser.

### Installing

Use `npm` or `yarn` to install in a `node` project that uses `webpack`, `browserify` or similar.

```sh
npm install --save @storefront/recommendations
# or
yarn add @storefront/recommendations
```

## Usage

This module provides the `<gb-recommendations>` component for use with StoreFront.

### Mount tag

```html
<!-- index.html -->
<body>
  <gb-recommendations></gb-recommendations>
</body>
```

```js
// index.js
storefront.mount('gb-recommendations');
```

## Running the tests

Tests can be run to generate coverage information.
Once run, open `coverage/index.html` in your browser to view coverage breakdown.

```sh
npm start coverage
# or
yarn start coverage
```

Tests can be run continuously for development

```sh
npm run tdd
# or
yarn tdd
```

Tests can also be run alone

```sh
npm test
# or
yarn test
```
