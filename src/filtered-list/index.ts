import { tag, Tag } from '@storefront/core';

@tag('gb-filtered-list', require('./index.html'))
class FilteredList {
  refs: { filter: HTMLInputElement };
  items: FilteredList.Item[];
  props: FilteredList.Props = {
    items: [],
  };

  childProps() {
    const { itemAlias, indexAlias } = this.props;
    return { itemAlias, indexAlias, items: this.items };
  }

  onBeforeMount() {
    this.updateItems('');
  }

  onUpdate() {
    this.updateItems();
  }

  onFilterChange(event: Tag.Event) {
    this.updateItems();
  }

  updateItems(value: string = this.refs.filter.value) {
    value = value.trim().toLowerCase();
    const filtered = this.props.items.filter((item) => {
      if (!item) {
        return false;
      } else if (typeof item === 'string') {
        return item.toLowerCase().includes(value);
      } else if (typeof item.value === 'string') {
        return item.value.toLowerCase().includes(value);
      } else {
        return false;
      }
    });

    if (filtered.length !== 0 || this.items.length !== 0) {
      this.items = filtered;
    }
  }
}

interface FilteredList extends Tag<FilteredList.Props> {}
namespace FilteredList {
  export interface Props extends Tag.Props {
    items?: Item[];
    itemAlias?: string;
    indexAlias?: string;
  }

  export type Item = string | { value: string };
}

export default FilteredList;
