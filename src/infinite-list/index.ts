import { tag, Tag } from '@storefront/core';
import List from '../list';

@tag('gb-infinite-list', require('./index.html'), require('./index.css'))
class InfiniteList extends List {}

export default InfiniteList;