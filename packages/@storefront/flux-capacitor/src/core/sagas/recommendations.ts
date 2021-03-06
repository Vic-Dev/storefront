import { Biasing, Request, Sort } from 'groupby-api';
import * as effects from 'redux-saga/effects';
import FluxCapacitor from '../../flux-capacitor';
import Actions from '../actions';
import ConfigAdapter from '../adapters/configuration';
import PageAdapter from '../adapters/page';
import SearchAdapter from '../adapters/search';
import Configuration from '../configuration';
import {
  autocompletePastPurchaseRequest,
  pastPurchaseProductsRequest,
  recommendationsProductsRequest,
  recommendationsProductIdsRequest
} from '../requests';
import Selectors from '../selectors';
import Store from '../store';
import * as utils from '../utils';
import RequestsTasks from './requests';

export class MissingPayloadError extends Error {
  /* istanbul ignore next */
  constructor(err: string = 'No Secured Payload') {
    super(err);
    Object.setPrototypeOf(this, MissingPayloadError.prototype);
  }
}

export namespace RecommendationsTasks {
  // tslint:disable-next-line max-line-length
  export function* fetchRecommendationsProducts(flux: FluxCapacitor, action: Actions.FetchRecommendationsProducts) {
    try {
      const state = yield effects.select();
      const config = yield effects.select(Selectors.config);
      const { idField, productSuggestions: productConfig } = config.recommendations;
      const productCount = productConfig.productCount;
      if (productCount > 0) {
        const body = recommendationsProductIdsRequest.composeRequest(state, action.payload.request);
        const recommendationsResponse = yield effects.call(
          RequestsTasks.recommendations,
          {
            customerId: config.customerId,
            endpoint: 'products',
            // fall back to default mode "popular" if not provided
            // "popular" default will likely provide the most consistently strong data
            mode: Configuration.RECOMMENDATION_MODES[productConfig.mode || 'popular'],
            body
          }
        );

        const recommendations = yield recommendationsResponse.json();
        const refinements = recommendations.result
          .filter(({ productId }) => productId)
          .map(({ productId }) => ({ navigationName: idField, type: 'Value', value: productId }));
        const requestBody = recommendationsProductsRequest.composeRequest(
          state,
          {
            pageSize: productConfig.productCount,
            includedNavigations: [],
            skip: 0,
            refinements
          }
        );
        const results = yield effects.call(RequestsTasks.search, flux, requestBody);

        yield effects.put(flux.actions.receiveRecommendationsProducts(SearchAdapter.augmentProducts(results)));
      }
    } catch (e) {
      yield effects.put(flux.actions.receiveRecommendationsProducts(e));
    }
  }

  export function* fetchPastPurchaseSkus(config: Configuration, endpoint: string, query?: string) {
    const securedPayload = ConfigAdapter.extractSecuredPayload(config);
    if (securedPayload) {
      const response = yield effects.call(
        RequestsTasks.pastPurchases,
        {
          customerId: config.customerId,
          endpoint,
          body: { securedPayload, query }
        }
      );

      const { result } = yield response.json();
      if (!result) {
        throw new MissingPayloadError();
      }
      return result;
    }
    throw new MissingPayloadError();
  }

  export function* fetchPastPurchases(flux: FluxCapacitor, _: Actions.FetchPastPurchases) {
    try {
      const config: Configuration = yield effects.select(Selectors.config);
      const productCount = ConfigAdapter.extractPastPurchaseProductCount(config);
      if (productCount > 0) {
        const result = yield effects.call(fetchPastPurchaseSkus, config, 'popular');
        yield effects.put(<any>[
          flux.actions.receivePastPurchaseAllRecordCount(result.length),
          flux.actions.receivePastPurchaseSkus(result)
        ]);
      } else {
        yield effects.put(flux.actions.receivePastPurchaseSkus([]));
      }
    } catch (e) {
      if (!(e instanceof MissingPayloadError)) { // pass through misisng payloads
        return effects.put(flux.actions.receivePastPurchaseSkus(e));
      }
    }
  }

  export function* fetchPastPurchaseProducts(flux: FluxCapacitor, action: Actions.FetchPastPurchaseProducts) {
    try {
      const pastPurchaseSkus: Store.PastPurchases.PastPurchaseProduct[] = yield effects.select(Selectors.pastPurchases);
      if (pastPurchaseSkus.length > 0) {
        const state = yield effects.select();
        const request = pastPurchaseProductsRequest.composeRequest(state, action.payload.request);
        const results = yield effects.call(RequestsTasks.search, flux, request);
        const pageSize = request.pageSize;
        yield effects.put(<any>[
          flux.actions.receivePastPurchaseSiteParams(results.siteParams),
          flux.actions.updatePastPurchasePageSize(pageSize),
          flux.actions.receivePastPurchasePage(
            SearchAdapter.extractRecordCount(results.totalRecordCount),
            PageAdapter.currentPage(request.skip, pageSize),
            pageSize
          ),
          flux.actions.receivePastPurchaseCurrentRecordCount(results.totalRecordCount),
          flux.actions.receivePastPurchaseProducts(SearchAdapter.augmentProducts(results)),
          flux.actions.receivePastPurchaseTemplate(SearchAdapter.extractTemplate(results.template)),
          // tslint:disable-next-line max-line-length
          flux.actions.receivePastPurchaseRefinements(SearchAdapter.pruneRefinements(SearchAdapter.combineNavigations(results), utils.StoreSections.PAST_PURCHASES, state)),
        ]);
        flux.replaceState(utils.Routes.PAST_PURCHASE, action.payload.buildAndParse);
      }
    } catch (e) {
      return effects.put(flux.actions.receivePastPurchaseProducts(e));
    }
  }

  export function* fetchMorePastPurchaseProducts(flux: FluxCapacitor, action: Actions.FetchMorePastPurchaseProducts) {
    try {
      const state: Store.State = yield effects.select();
      const products = Selectors.pastPurchaseProductsWithMetadata(state);
      const pastPurchaseSkus: Store.PastPurchases.PastPurchaseProduct[] = yield effects.select(Selectors.pastPurchases);
      const pageSize = action.payload.amount;

      let skip;
      if (action.payload.forward) {
        skip = products[products.length - 1].index;
        yield effects.put(<any>flux.actions.infiniteScrollRequestState({ isFetchingForward: true }));
      } else {
        skip = products[0].index - Selectors.pastPurchasePageSize(state) - 1;
        yield effects.put(<any>flux.actions.infiniteScrollRequestState({ isFetchingBackward: true }));
      }

      const request = pastPurchaseProductsRequest.composeRequest(state, {
        pageSize,
        skip,
        ...action.payload.request
      });
      const result = yield effects.call(RequestsTasks.search, flux, request);

      yield effects.put(<any>[
        flux.actions.receivePastPurchaseCurrentRecordCount(result.totalRecordCount),
        flux.actions.receiveMorePastPurchaseProducts(result),
      ]);
      if (action.payload.forward) {
        yield effects.put(<any>flux.actions.infiniteScrollRequestState({ isFetchingForward: false }));
      } else {
        yield effects.put(<any>flux.actions.infiniteScrollRequestState({ isFetchingBackward: false }));
      }
    } catch (e) {
      return effects.put(<any>flux.actions.receiveMorePastPurchaseProducts(e));
    }
  }

  // tslint:disable-next-line max-line-length
  export function* fetchSaytPastPurchases(flux: FluxCapacitor, { payload: { query, request } }: Actions.FetchSaytPastPurchases) {
    try {
      const state = yield effects.select();
      const pastPurchaseSkus = yield effects.select(Selectors.pastPurchases);
      if (pastPurchaseSkus.length > 0) {
        const req = autocompletePastPurchaseRequest.composeRequest(state, { query, ...request });
        const results = yield effects.call(RequestsTasks.search, flux, req);
        yield effects.put(flux.actions.receiveSaytPastPurchases(SearchAdapter.augmentProducts(results)));
      } else {
        yield effects.put(flux.actions.receiveSaytPastPurchases([]));
      }
    } catch (e) {
      return effects.put(flux.actions.receiveSaytPastPurchases(e));
    }
  }
}

export default (flux: FluxCapacitor) => function* recommendationsSaga() {
  // tslint:disable-next-line max-line-length
  yield effects.takeLatest(Actions.FETCH_RECOMMENDATIONS_PRODUCTS, RecommendationsTasks.fetchRecommendationsProducts, flux);
  yield effects.takeLatest(Actions.FETCH_PAST_PURCHASES, RecommendationsTasks.fetchPastPurchases, flux);
  yield effects.takeLatest(Actions.FETCH_PAST_PURCHASE_PRODUCTS, RecommendationsTasks.fetchPastPurchaseProducts, flux);
  yield effects.takeLatest(Actions.FETCH_SAYT_PAST_PURCHASES, RecommendationsTasks.fetchSaytPastPurchases, flux);
  // tslint:disable-next-line max-line-length
  yield effects.takeEvery(Actions.FETCH_MORE_PAST_PURCHASE_PRODUCTS, RecommendationsTasks.fetchMorePastPurchaseProducts, flux);
};
