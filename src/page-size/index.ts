import { alias, configurable, tag, Events, Selectors, Store, Tag } from '@storefront/core';

@configurable
@alias('pageSize')
@tag('gb-page-size', require('./index.html'))
class PageSize {

  state: PageSize.State = {
    pageSizes: this.selectPageSizes(Selectors.pageSizes(this.flux.store.getState())),
    onSelect: (index) => this.actions.updatePageSize(this.state.pageSizes[index].value)
  };

  init() {
    this.flux.on(Events.PAGE_SIZE_UPDATED, this.updatePageSizes);
  }

  updatePageSizes = (state: Store.SelectableList<number>) =>
    this.set({ pageSizes: this.selectPageSizes(state) })

  selectPageSizes(state: Store.SelectableList<number>) {
    return state.items.map((pageSize, index) => ({
      value: pageSize,
      label: pageSize,
      selected: index === state.selected
    }));
  }
}

interface PageSize extends Tag<any, PageSize.State> { }
namespace PageSize {
  export interface State {
    pageSizes: Option[];
    onSelect(index: number): void;
  }

  export interface Option {
    value: number;
    label: number;
    selected?: boolean;
  }
}

export default PageSize;