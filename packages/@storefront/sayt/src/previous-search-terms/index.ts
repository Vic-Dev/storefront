import { provide, tag, Events, Store, Tag } from '@storefront/core';

@provide('previousSearchTerms', (props) => props)
<<<<<<< HEAD
@tag('gb-sayt-previous-search-terms', require('./index.html'))
=======
<<<<<<< HEAD
<<<<<<< HEAD
@tag('gb-sayt-previous-search', require('./index.html'))
=======
@tag('gb-sayt-previous-search-terms', require('./index.html'))
>>>>>>> made previous search limit configurable
>>>>>>> made previous search limit configurable
class PreviousSearchTerms {
  props: PreviousSearchTerms.Props = {
    onClick: (query) => () => this.actions.search(query),
    previousSearchLimit: 5,
  };
  state: PreviousSearchTerms.State = {
    previousSearches: [],
  }

  constructor() {
    this.updatePreviousSearches = this.updatePreviousSearches.bind(this);
  }

  init() {
    this.subscribe(Events.ORIGINAL_QUERY_UPDATED, this.updatePreviousSearches);
  }


  updatePreviousSearches(originalQuery: string) {
    if (this.state.previousSearches.length === 0) {
      this.flux.emit('previous:show');
    }
    let previousSearches = this.state.previousSearches;
    if (this.state.previousSearches.indexOf(originalQuery) === -1) {
      if (this.state.previousSearches.length < this.props.previousSearchLimit) {
<<<<<<< HEAD
        previousSearches = [...this.state.previousSearches, originalQuery];
=======
        this.state.previousSearches = [...this.state.previousSearches, originalQuery];
>>>>>>> made previous search limit configurable
      } else {
        this.state.previousSearches.shift();
        previousSearches = [...this.state.previousSearches, originalQuery];
      }
    } else {
<<<<<<< HEAD
      previousSearches = [...this.state.previousSearches.splice(this.state.previousSearches.indexOf(originalQuery), 1), ...this.state.previousSearches];
=======
      this.state.previousSearches = [...this.state.previousSearches.splice(this.state.previousSearches.indexOf(originalQuery), 1), ...this.state.previousSearches]
<<<<<<< HEAD
=======
import { provide, tag, Events, Selectors, Store, Tag } from '@storefront/core';
import Sayt from '../sayt';
=======
import { provide, tag, Events, Tag } from '@storefront/core';
>>>>>>> made requested changes to previousSearches component

@provide('previousSearch', (props) => props)
=======
>>>>>>> changed alias name, wrote initial unit test for previous searches component and added file to bootstrap
@tag('gb-sayt-previous-search', require('./index.html'))
class PreviousSearchTerms {
  props: PreviousSearchTerms.Props = {
    onClick: (query) => () => this.actions.search(query),
  };
  state: PreviousSearchTerms.State = {
    previousSearches: [],
  }

  constructor() {
    this.updatePreviousSearches = this.updatePreviousSearches.bind(this);
  }

  init() {
    this.subscribe(Events.ORIGINAL_QUERY_UPDATED, this.updatePreviousSearches);
  }

<<<<<<< HEAD
  updatePreviousSearches = (originalQuery: string) => {
    if(!this.state.previousSearches.includes(originalQuery) && this.state.previousSearches.length < 6) {
      this.state.previousSearches.push(originalQuery)
    } else if (!this.state.previousSearches.includes(originalQuery) && this.state.previousSearches.length >= 6) {
      this.state.previousSearches.shift()
      this.state.previousSearches.push(originalQuery)
>>>>>>>  Made initial previous search terms component
=======

  updatePreviousSearches(originalQuery: string) {
    if (this.state.previousSearches.indexOf(originalQuery) === -1) {
      if (this.state.previousSearches.length < 6) { // to be set in the storefront config
        this.state.previousSearches = [...this.state.previousSearches, originalQuery];
      } else {
        this.state.previousSearches.shift();
        this.state.previousSearches = [...this.state.previousSearches, originalQuery];
      }
>>>>>>> made requested changes to previousSearches component
=======
>>>>>>> wrote more unit test for updatePreviousSearches and added new functinality to move search term to begining if already in the list
>>>>>>> wrote more unit test for updatePreviousSearches and added new functinality to move search term to begining if already in the list
    }
    this.set({
      previousSearches
    });
  }
}

interface PreviousSearchTerms extends Tag<PreviousSearchTerms.Props, PreviousSearchTerms.State> {}
namespace PreviousSearchTerms {
  export interface Props {
    onClick: (query: string) => () => void;
    previousSearchLimit?: number;
  }
  export interface State {
    previousSearches?: string[];
  }
}

export default PreviousSearchTerms;
<<<<<<< HEAD
=======
=======
interface PreviousSearch extends Tag<PreviousSearch.Props, PreviousSearch.State> {}
namespace PreviousSearch {
=======
interface PreviousSearchTerms extends Tag<PreviousSearchTerms.Props, PreviousSearchTerms.State> {}
namespace PreviousSearchTerms {
>>>>>>> changed alias name, wrote initial unit test for previous searches component and added file to bootstrap
  export interface Props {
    onClick: (query: string) => () => void;
    previousSearchLimit?: number;
  }
  export interface State {
    previousSearches?: string[];
  }
}

<<<<<<< HEAD
export default PreviousSearch;
>>>>>>>  Made initial previous search terms component
=======
export default PreviousSearchTerms;
>>>>>>> changed alias name, wrote initial unit test for previous searches component and added file to bootstrap
>>>>>>> made previous search limit configurable
