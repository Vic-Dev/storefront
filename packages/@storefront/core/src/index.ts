import './globals';
import StoreFront from './storefront';

console.log('__ INSIDE `core` MANIFEST');

export * from './core';
export * from './tags';
export { Actions, Events, Selectors, Store, StoreSections } from '@storefront/flux-capacitor';
export { default as Services } from './services';
export default StoreFront;
