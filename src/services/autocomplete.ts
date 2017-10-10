import FluxCapacitor, { Events, Selectors, Store } from '@storefront/flux-capacitor';
import { core } from '../core/service';
import LazyService from '../core/service/lazy';
import Tag from '../core/tag';
import { WINDOW } from '../core/utils';
import StoreFront from '../storefront';

@core
class AutocompleteService extends LazyService {

  registeredProductTags: Tag[] = [];
  registeredAutocompleteTags: AutocompleteTag[] = [];

  lazyInit() {
    this.app.flux.on(Events.AUTOCOMPLETE_QUERY_UPDATED, this.updateSearchTerms);
    if (this.app.config.recommendations.location) {
      this.app.flux.once(Events.AUTOCOMPLETE_QUERY_UPDATED, this.requestLocation);
    }
  }

  lazyInitProducts() {
    this.app.flux.on(Events.AUTOCOMPLETE_SUGGESTIONS_UPDATED, this.updateProducts);
  }

  registerAutocomplete(tag: AutocompleteTag) {
    this.registeredAutocompleteTags.push(tag);
  }

  registerProducts(tag: Tag) {
    if (this.registeredProductTags.push(tag) === 1) {
      this.lazyInitProducts();
    }
  }

  hasActiveSuggestion() {
    return this.registeredAutocompleteTags.some((tag) => tag.isActive());
  }

  updateSearchTerms = (query: string) => this.app.flux.saytSuggestions(query);

  updateProducts = ({ suggestions }: Store.Autocomplete) => {
    if (suggestions && suggestions.length !== 0) {
      this.app.flux.saytProducts(suggestions[0].value);
    }
  }

  requestLocation = () => WINDOW().navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    this.app.flux.store.dispatch(this.app.flux.actions.updateLocation({ latitude, longitude }));
  }, (e) => this.app.log.error('unable to get location', e))
}

export default AutocompleteService;

export interface AutocompleteTag extends Tag {
  isActive(): boolean;
}