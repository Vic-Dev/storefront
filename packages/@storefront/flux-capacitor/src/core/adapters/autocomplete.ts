import Actions from '../actions';
import Configuration from '../configuration';
import { RecommendationsResponse } from '../types';
import Config from './configuration';

namespace AutocompleteAdapter {

  export const extractLanguage = (config: Configuration) =>
    Config.extractAutocompleteLanguage(config) || Config.extractLanguage(config);

  export const extractProductLanguage = (config: Configuration) =>
    Config.extractAutocompleteProductLanguage(config) || AutocompleteAdapter.extractLanguage(config);

  export const extractArea = (config: Configuration) =>
    Config.extractAutocompleteArea(config) || Config.extractArea(config);

  export const extractProductArea = (config: Configuration) =>
    Config.extractAutocompleteProductArea(config) || AutocompleteAdapter.extractArea(config);

  // tslint:disable-next-line max-line-length
  export const extractSuggestions = ({ result }: any, query: string, category: string, labels: { [key: string]: string }, config: Configuration): Actions.Payload.Autocomplete.Suggestions => {

    const searchTerms = result.searchTerms || [];
    const navigations = result.navigations || [];
    let hasCategory = category && searchTerms[0] && AutocompleteAdapter.termsMatch(searchTerms[0].value, query);
    let categoryValues = hasCategory
      ? [{ matchAll: true }, ...AutocompleteAdapter.extractCategoryValues(searchTerms[0], category)]
      : [];
    if ( Config.extractSaytCategoriesForFirstMatch(config) ) {
      hasCategory = category && searchTerms[0];
      categoryValues = (hasCategory && searchTerms[0].additionalInfo)
        ? [{ matchAll: true }, ...AutocompleteAdapter.extractCategoryValues(searchTerms[0], category)]
        : [{ matchAll: true }];
    }
    // tslint:disable-next-line max-line-length
    if (hasCategory) {
      searchTerms[0].disabled = true;
    }
    return {
      categoryValues,
      suggestions: searchTerms.map(({ value, disabled, additionalInfo }) => ({ value, disabled, additionalInfo })),
      navigations: navigations.map(({ name: field, values: refinements }) =>
        ({ field, label: labels[field] || field, refinements }))
    };
  };

  // tslint:disable-next-line max-line-length
  export const extractCategoryValues = ({ additionalInfo }: { additionalInfo: object }, category: string) =>
    ((additionalInfo || {})[category] || []).map((value) => ({ value }));

  export const mergeSuggestions = (suggestions: Array<{ value: string }>, recommendations: RecommendationsResponse) =>
    [...recommendations.result.map(({ query }) => ({ value: query, trending: true })), ...suggestions];

  export const termsMatch = (lhs: string, rhs: string) => {
    return lhs.toLowerCase().trim() === rhs.toLowerCase().trim();
  };
}

export default AutocompleteAdapter;
