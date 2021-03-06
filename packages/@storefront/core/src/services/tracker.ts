import { Actions, Events } from '@storefront/flux-capacitor';
import ProductTransformer from '../core/product-transformer';
import { core, BaseService } from '../core/service';
import { GbTracker } from '../core/utils';
import StoreFront from '../storefront';

const GBI = 'gbi';
const GBI_EXPERIENCE ='gbi_experience';
export const GBI_METADATA: GbTracker.Metadata[] = [
  {
    key: GBI,
    value: 'true'
  },
  {
    key: GBI_EXPERIENCE,
    value: 'storefront'
  }
];
export const TRACKER_EVENT = 'tracker:send_event';
export const DEFAULT_ORIGINS = {
  dym: false,
  recommendations: false,
  autosearch: false,
  navigation: false,
  collectionSwitcher: false,
  sayt: false,
};

export type Override<S, T> = (payload: S | T, event: T) => T;

class TrackerService extends BaseService<TrackerService.Options> {

  client: GbTracker = new GbTracker(this.app.config.customerId, this.app.config.area);
  transform: (product: any) => any = ProductTransformer.transformer(this.app.config.structure);

  constructor(app: StoreFront, opts: TrackerService.Options) {
    super(app, opts);

    this.setListeners(app);
  }

  init() {
    if (!this.opts.warnings) {
      this.client.disableWarnings();
    }

    this.client.autoSetVisitor(this.app.config.visitorId);
    this.app.flux.store.dispatch(this.app.flux.actions.setSessionId(this.client.getSessionId()));
  }

  applyOptsOverride<S, T>(defaultFn: (value: any, override?: Override<S, T>) => void, override: Override<S, T>) {
    return typeof override === 'function'
    ? (listenerValue) => defaultFn(listenerValue, override)
    : (listenerValue) => defaultFn(listenerValue);
  }

  setListeners(app: StoreFront) {
    // tslint:disable max-line-length
    app.flux.on(Events.BEACON_SEARCH, this.applyOptsOverride(this.sendSearchEvent, this.opts.sendSearchEvent));
    app.flux.on(Events.BEACON_VIEW_CART, this.applyOptsOverride(this.sendViewCartEvent, this.opts.sendViewCartEvent));
    app.flux.on(Events.BEACON_ADD_TO_CART, this.applyOptsOverride(this.sendAddToCartEvent, this.opts.sendAddToCartEvent));
    app.flux.on(Events.BEACON_REMOVE_FROM_CART, this.applyOptsOverride(this.sendRemoveFromCartEvent, this.opts.sendRemoveFromCartEvent));
    app.flux.on(Events.BEACON_ORDER, this.applyOptsOverride(this.sendOrderEvent, this.opts.sendOrderEvent));
    app.flux.on(Events.BEACON_VIEW_PRODUCT, this.applyOptsOverride(this.sendViewProductEvent, this.opts.sendViewProductEvent));
    app.flux.on(Events.BEACON_MORE_REFINEMENTS, this.applyOptsOverride(this.sendMoreRefinementsEvent, this.opts.sendMoreRefinementsEvent));
    // tslint:enable
  }

  sendEvent(method: keyof GbTracker, event: any) {
    this.app.flux.emit(TRACKER_EVENT, { type: method, event });
    try {
      (<any>this.client[method])(event);
    } catch (e) {
      this.app.log.error('unable to send beaconing data', e);
    }
  }

  attachGbiEventMetadata = <S extends GbTracker.BaseEvent>(override: S): S => {
    const { metadata = [] } = override;

    const filteredMetadata = metadata.filter((item) => item.key !== GBI && item.key !== GBI_EXPERIENCE);

    // tslint:disable comment-format
    // XXX: Below needs to be cast as such in order to get around the restrictions of TypeScript version 3.1.5, not allowing for generic types to be spread.
    // Source: https://stackoverflow.com/a/51193091
    // TODO: These casts can be removed once we update to TypeScript 3.2.
    return <S>{ ...<GbTracker.BaseEvent>override, metadata: [...GBI_METADATA, ...filteredMetadata] };
    // tslint:enable
  }

  buildEvent = <S, T>(override: Override<S, T>, event: T, value: S | T = event) => {
    const currentEvent = this.addMetadata(event);

    return this.attachGbiEventMetadata<T>(override(value, currentEvent));
  }

  sendSearchEvent = (id: string, override: Override<string, GbTracker.SearchEvent> = (value, val) => val) => {
    const origin = this.getSearchOrigin();
    const currentEvent = {
      search: {
        id,
        origin: {
          ...DEFAULT_ORIGINS,
          [(origin || <any>{}).origin || 'search']: true
        },
      }
    };

    this.sendEvent('sendAutoSearchEvent', this.buildEvent<string, GbTracker.SearchEvent>(override, currentEvent, id));
  }

  // tslint:disable-next-line max-line-length
  sendViewCartEvent = (event: GbTracker.CartEvent, override: Override<GbTracker.CartEvent, GbTracker.CartEvent> = (value, val) => val) => {
    this.sendEvent('sendViewCartEvent', this.buildEvent<GbTracker.CartEvent, GbTracker.CartEvent>(override, event));
  }

  // tslint:disable-next-line max-line-length
  sendAddToCartEvent = (event: GbTracker.CartEvent, override: Override<GbTracker.CartEvent, GbTracker.CartEvent> = (value, val) => val) => {
    this.sendEvent('sendAddToCartEvent', this.buildEvent<GbTracker.CartEvent, GbTracker.CartEvent>(override, event));
  }

  // tslint:disable-next-line max-line-length
  sendRemoveFromCartEvent = (event: GbTracker.CartEvent, override: Override<GbTracker.CartEvent, GbTracker.CartEvent> = (value, val) => val) => {
    this.sendEvent('sendRemoveFromCartEvent', this.buildEvent<GbTracker.CartEvent, GbTracker.CartEvent>(override, event));
  }

  // tslint:disable-next-line max-line-length
  sendOrderEvent = (event: GbTracker.OrderEvent, override: Override<GbTracker.OrderEvent, GbTracker.OrderEvent> = (value, val) => val) => {
    this.sendEvent('sendOrderEvent', this.buildEvent<GbTracker.OrderEvent, GbTracker.OrderEvent>(override, event));
  }

  // tslint:disable-next-line max-line-length
  sendViewProductEvent = (record: any, override: Override<GbTracker.ViewProductEvent, GbTracker.ViewProductEvent> = (value, val) => val) => {
    const { data: { id: productId, title, price } } = this.transform(record.allMeta);
    const currentEvent = {
      product: {
        productId,
        title,
        price,
        collection: record.collection
      }
    };

    this.sendEvent('sendViewProductEvent', this.buildEvent<GbTracker.ViewProductEvent, GbTracker.ViewProductEvent>(override, currentEvent, record));
  }

  // tslint:disable-next-line max-line-length
  sendMoreRefinementsEvent = (id: string, override: Override<string, GbTracker.MoreRefinementsEvent> = (value, val) => val) => {
    const currentEvent = { moreRefinements: { id } };

    this.sendEvent('sendMoreRefinementsEvent', this.buildEvent<string, GbTracker.MoreRefinementsEvent>(override, currentEvent, id));
  }

  addMetadata(event: any) {
    return {
      ...event,
      metadata: [...(event.metadata || []), ...this.getMetadata()]
    };
  }

  getSearchOrigin() {
    return this.app.flux.store.getState().session.origin;
  }

  getMetadata(origin: Actions.Metadata.Tag = this.getSearchOrigin()) {
    return origin ? [
      { key: 'tagName', value: origin.name },
      { key: 'tagId', value: String(origin.id) },
    ] : [];
  }
}

namespace TrackerService {
  export interface Options {
    warnings?: boolean;
    sendSearchEvent?: Override<string, GbTracker.SearchEvent>;
    sendViewCartEvent?: Override<GbTracker.CartEvent, GbTracker.CartEvent>;
    sendAddToCartEvent?: Override<GbTracker.CartEvent, GbTracker.CartEvent>;
    sendRemoveFromCartEvent?: Override<GbTracker.CartEvent, GbTracker.CartEvent>;
    sendOrderEvent?: Override<GbTracker.OrderEvent, GbTracker.OrderEvent>;
    sendViewProductEvent?: Override<GbTracker.ViewProductEvent, GbTracker.ViewProductEvent>;
    sendMoreRefinementsEvent?: Override<string, GbTracker.MoreRefinementsEvent>;
  }
}

export default TrackerService;
