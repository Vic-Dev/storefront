import { consume, tag, Tag } from '@storefront/core';

@consume('infinite')
@tag('gb-infinite-loader', require('./index.html'))
class InfiniteLoader {}

interface InfiniteLoader extends Tag {}

export default InfiniteLoader;
