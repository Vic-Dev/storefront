import * as redux from 'redux';

import area from './area';
import autocomplete from './autocomplete';
import collections from './collections';
import details from './details';
import history from './history';
import infiniteScroll from './infinite-scroll';
import navigations from './navigations';
import page from './page';
import pastPurchases from './past-purchases';
import personalization from './personalization';
import products from './products';
import productsLoaded from './productsLoaded';
import query from './query';
import recommendations from './recommendations';
import recordCount from './record-count';
import redirect from './redirect';
import siteParams from './site-params';
import sorts from './sorts';
import template from './template';

export default redux.combineReducers({
  area,
  autocomplete,
  collections,
  details,
  fields: (state = []) => state,
  history,
  infiniteScroll,
  navigations,
  page,
  personalization,
  products,
  productsLoaded,
  query,
  recommendations,
  pastPurchases,
  recordCount,
  redirect,
  siteParams,
  sorts,
  template,
});
