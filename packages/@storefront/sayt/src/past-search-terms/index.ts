import { provide, tag, Selectors, Store, Tag } from '@storefront/core';
import Sayt from '../sayt';

@provide('pastSearchTerms', (props) => props)
@tag('gb-sayt-past-search-terms', require('./index.html'))
class PastSearchTerms {
  props: PastSearchTerms.Props = {
    onClick: (query) => () => this.actions.search(query),
  } as any;
}

interface PastSearchTerms extends Tag<PastSearchTerms.Props> {}
namespace PastSearchTerms {
  export interface Props {
    onClick: (query: string) => () => void;
    pastSearches: string[];
  }
}

export default PastSearchTerms;
