import { bootstrap } from '@storefront/testing';
import * as chai from 'chai';

bootstrap(chai, __dirname, [
  '../src/infinite-scroll/index.html',
  '../src/infinite-scroll/index.css',
  '../src/loader/index.html'
]);
