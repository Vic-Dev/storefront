import { Selectors } from '@storefront/flux-capacitor';
import moize from 'moize';
import StoreFront from '../../storefront';
import Tag from '../tag';
import utils from './utils';

export const PROVIDES_KEY = 'provides';
export const CONSUMES_KEY = 'consumes';
export const ORIGIN_KEY = 'origin';
export const CONFIGURABLE_KEY = 'configurable';

export type TagConstructor = { new (): Tag };

export function tag(name: string, template: string, cssVal?: string) {
  return <P extends object>(
    target: TagConstructor = function() {
      return this;
    } as any
  ) => {
    const description = Tag.getDescription(target);
    const newDescription = {
      ...description,
      metadata: { ...description.metadata, name },
      view: template,
    };

    if (cssVal) {
      newDescription.css = cssVal;
    }

    Tag.setDescription(target, newDescription);
    StoreFront.register((register) => register(target, name));
  };
}

export function view(name: string, template: string, cssVal?: string) {
  exports.tag(name, template, cssVal)();
}

export function css(style: string) {
  return <P extends object>(target: TagConstructor) => {
    Tag.setDescription(target, {
      ...Tag.getDescription(target),
      css: style.toString(),
    });
  };
}

export function alias<P extends object = any, S extends object = any, A extends object = any>(name: string) {
  return (target: TagConstructor) => {
    utils.setMetadata(target, PROVIDES_KEY, {
      ...(utils.getMetadata(target, PROVIDES_KEY) as any),
      [name]: (_, state: S) => () => state,
    });
  };
}

export function provide<P extends object = any, S extends object = any, A extends object = any>(
  name: string,
  resolver: (props: P, state: S, aliases: A) => any = (_, state) => state
) {
  return (target: TagConstructor) => {
    utils.setMetadata(target, PROVIDES_KEY, {
      ...(utils.getMetadata(target, PROVIDES_KEY) as any),
      [name]: moize((props: P, state: S) => (aliases: A) => resolver(props, state, aliases)),
    });
  };
}

export function consume(name: string) {
  return (target: TagConstructor) => {
    utils.setMetadata(target, CONSUMES_KEY, [...((utils.getMetadata(target, CONSUMES_KEY) as any) || []), name]);
  };
}

export function origin(name: string) {
  return <P extends object>(target: TagConstructor) => {
    utils.setMetadata(target, ORIGIN_KEY, name);
  };
}

export function configurable<P extends object>(target: TagConstructor) {
  utils.setMetadata(target, CONFIGURABLE_KEY, true);
}

export function uiState<P extends object = any, S extends object = any, A extends object = any>(
  prop: string = 'uiValue',
  resolver: (props: P, state: S, aliases: A[]) => any = (_, state) => state
) {
  return (target: TagConstructor) => {
    const { onBeforeMount, onBeforeUnmount } = target.prototype;

    target.prototype.onBeforeMount = function(...args: any) {
      const storedState = this.select(Selectors.uiTagState, Tag.getMeta(this).name, this.props[prop]);
      console.log('target BeforeMount', storedState);
      debugger;

      if (storedState) {
        this.state = { ...this.state, ...storedState };
        this.set(true);
      }

      if (onBeforeMount && typeof onBeforeMount === 'function') {
        return onBeforeMount.apply(this, args);
      }
    };

    target.prototype.onBeforeUnmount = function(...args: any) {
      const storedState = this.select(Selectors.uiTagState, Tag.getMeta(this).name, this.props[prop]);
      const resolvedState = resolver(this.props, this.state, Tag.findConsumes(this).map((a) => this[`$${a}`]));

      console.log('target UnMount', this.state);
      debugger;

      if (!storedState || Object.keys(storedState).some((key) => storedState[key] !== resolvedState[key])) {
        this.actions.createComponentState(
          Tag.getMeta(this).name,
          this.props[prop],
          resolvedState);
      }

      if (onBeforeUnmount && typeof onBeforeUnmount === 'function') {
        return onBeforeUnmount.apply(this, args);
      }
    };
  };
}
