import ConfigAdapter from '../../../../src/core/adapters/configuration';
import PageAdapter from '../../../../src/core/adapters/page';
import Adapter, { MAX_RECORDS } from '../../../../src/core/adapters/search';
import Selectors from '../../../../src/core/selectors';
import suite from '../../_suite';

suite('Search Adapter', ({ expect, stub }) => {

  describe('extractQuery()', () => {
    it('should convert results to query structure', () => {
      const results: any = {
        correctedQuery: 'apple pie',
        didYouMean: ['a', 'b'],
        relatedQueries: ['c', 'd'],
        rewrites: ['e', 'f'],
        originalQuery: 'ok'
      };

      const query = Adapter.extractQuery(results);

      expect(query).to.eql({
        corrected: 'apple pie',
        didYouMean: ['a', 'b'],
        related: ['c', 'd'],
        rewrites: ['e', 'f'],
        original: 'ok',
      });
    });
  });

  describe('extractRefinement()', () => {
    it('should return range refinement', () => {
      const refinement = Adapter.extractRefinement(<any>{
        type: 'Range',
        low: 20,
        high: 30,
        count: 50,
        a: 'b',
        c: 'd',
      });

      expect(refinement).to.eql({ low: 20, high: 30, total: 50 });
    });

    it('should return value refinement', () => {
      const refinement = Adapter.extractRefinement(<any>{
        type: 'Value',
        value: 'Nike',
        count: 23,
        a: 'b',
        c: 'd',
      });

      expect(refinement).to.eql({ value: 'Nike', total: 23 });
    });
  });

  describe('extractNavigationSort()', () => {
    it('should return an equivalent sort object', () => {
      expect(Adapter.extractNavigationSort('Count_Ascending')).to.eql({ field: 'count' });
      expect(Adapter.extractNavigationSort('Count_Descending')).to.eql({ field: 'count', descending: true });
      expect(Adapter.extractNavigationSort('Value_Ascending')).to.eql({ field: 'value' });
      expect(Adapter.extractNavigationSort('Value_Descending')).to.eql({ field: 'value', descending: true });
    });
  });

  describe('extractNavigation()', () => {
    it('should convert navigation to storefront navigation structure', () => {
      const navigation: any = {
        name: 'brand',
        displayName: 'Brand',
        moreRefinements: true,
        or: true,
        refinements: ['a', 'b'],
        sort: { c: 'd' },
        metadata: [
          { key: 'e', value: 'f' },
          { key: 'g', value: 'h' },
        ]
      };
      const sort = { e: 'f' };
      const extractRefinement = stub(Adapter, 'extractRefinement').returns('x');
      const extractNavigationSort = stub(Adapter, 'extractNavigationSort').returns(sort);

      const extracted = Adapter.extractNavigation(navigation);

      expect(extracted).to.eql({
        field: 'brand',
        label: 'Brand',
        boolean: false,
        more: true,
        or: true,
        range: false,
        max: undefined,
        min: undefined,
        refinements: ['x', 'x'],
        selected: [],
        sort,
        metadata: { e: 'f', g: 'h' }
      });
      expect(extractRefinement).to.be.calledWith('a')
        .and.calledWith('b');
      expect(extractNavigationSort).to.be.calledWith({ c: 'd' });
    });

    it('should ignore sort if not truthy', () => {
      const navigation: any = { refinements: [], metadata: [] };
      const extractNavigationSort = stub(Adapter, 'extractNavigationSort');

      const extracted = Adapter.extractNavigation(navigation);

      expect(extracted.sort).to.be.undefined;
      expect(extractNavigationSort.called).to.be.false;
    });
  });

  describe('refinementsMatch()', () => {
    it('should match value refinements', () => {
      const lhs: any = { type: 'Value', value: 'blue', a: 'b' };
      const rhs: any = { type: 'Value', value: 'blue', c: 'd' };

      expect(Adapter.refinementsMatch(lhs, rhs)).to.be.true;
    });

    it('should not match value refinements', () => {
      const lhs: any = { type: 'Value', value: 'blue' };
      const rhs: any = { type: 'Value', value: 'black' };

      expect(Adapter.refinementsMatch(lhs, rhs)).to.be.false;
    });

    it('should match range refinements', () => {
      const lhs: any = { type: 'Range', low: 20, high: 30, a: 'b' };
      const rhs: any = { type: 'Range', low: 20, high: 30, c: 'd' };

      expect(Adapter.refinementsMatch(lhs, rhs)).to.be.true;
    });

    it('should not match range refinements', () => {
      const lhs: any = { type: 'Range', low: 20, high: 40 };
      const rhs: any = { type: 'Range', low: 10, high: 30 };

      expect(Adapter.refinementsMatch(lhs, rhs)).to.be.false;
    });

    it('should accept explicit type', () => {
      const lhs: any = { type: 'Range', value: 'prestigious' };
      const rhs: any = { type: 'Range', value: 'prestigious' };

      expect(Adapter.refinementsMatch(lhs, rhs, 'Value')).to.be.true;
    });
  });

  describe('mergeSelectedRefinements()', () => {
    it('should set selected on available navigation', () => {
      const available: any = { refinements: ['a', 'b', 'c', 'd'] };
      const selected: any = { refinements: ['a', 'd'] };
      const refinementsMatch = stub(Adapter, 'refinementsMatch')
        .callsFake((lhs, rhs) => lhs === rhs);

      Adapter.mergeSelectedRefinements(available, selected);

      expect(available.selected).to.eql([0, 3]);
      expect(refinementsMatch).to.be.calledWith('a', 'a')
        .and.calledWith('a', 'd')
        .and.calledWith('b', 'd')
        .and.calledWith('c', 'd')
        .and.calledWith('d', 'd');
    });

    it('should add selected value refinements', () => {
      const available: any = { refinements: ['a', 'b', 'c', 'd'] };
      const selected: any = { refinements: [{ value: 'e', total: 10 }, { value: 'f', total: 13 }] };
      stub(Adapter, 'refinementsMatch').returns(false);

      Adapter.mergeSelectedRefinements(available, selected);

      expect(available.refinements).to.eql([
        'a', 'b', 'c', 'd',
        { value: 'e', total: 10 },
        { value: 'f', total: 13 }
      ]);
      expect(available.selected).to.eql([4, 5]);
    });

    it('should add selected range refinements', () => {
      const available: any = { range: true, refinements: ['a', 'b', 'c', 'd'] };
      const selected: any = { refinements: [{ low: 3, high: 4, total: 10 }, { low: 7, high: 9, total: 13 }] };
      stub(Adapter, 'refinementsMatch').returns(false);

      Adapter.mergeSelectedRefinements(available, selected);

      expect(available.refinements).to.eql([
        'a', 'b', 'c', 'd',
        { low: 3, high: 4, total: 10 },
        { low: 7, high: 9, total: 13 }
      ]);
      expect(available.selected).to.eql([4, 5]);
    });
  });

  describe('filterExcludedRefinements()', () => {
    it('should remove excluded refinements', () => {
      const resultRefinements = [{ value: 'blue', type: 'Value' }, { value: 'red', type: 'Value' }];
      const refinements: any = [{ exclude: true, value: 'orange', type: 'Value' }, ...resultRefinements];

      const finalRefinements = Adapter.filterExcludedRefinements(refinements);

      expect(finalRefinements).to.eql(resultRefinements);
    });
  });

  describe('filterNavigations()', () => {
    it('should remove filtered excluded refinements and ignored navigations', () => {
      const navigations: any = [
        { name: 'Mill_Name', refinements: [{ exclude: true, value: 'Under Armour', type: 'Value' }], more: false },
        { name: 'B', refinements: [{}, { exclude: true }] },
        { name: 'C', refinements: [{}], more: true, ignored: true }
      ];

      const finalNavigations = Adapter.filterNavigations(navigations);

      expect(finalNavigations).to.eql([{ name: 'B', refinements: [{}] }]);
    });
  });

  describe('pruneRefinements()', () => {
    it('should mark which refinements to show', () => {
      const state: any = {};
      const storeSection = 'search';
      const conf = {};
      const max = stub(ConfigAdapter, 'extractMaxRefinements').returns(2);
      const config = stub(Selectors, 'config').returns(conf);
      const navigations: any = [
        { field: 'Adds non-selected refinement', refinements: [4], selected: [], more: false },
        { field: 'Adds selected refinements', refinements: [6, 7, 4, 5, 6, 8], selected: [1, 5] },
        { field: 'Adds selected refinement first', refinements: [8, 9], selected: [1], more: true },
        { field: 'Limits to max', refinements: [0, 1, 2, 3, 4], selected: [1, 2, 3, 4], more: true },
        { field: 'Limits to max', refinements: [0, 1, 2, 3, 4], selected: [], more: true },
      ];
      stub(ConfigAdapter, 'extractToggleNavigations').returns([]);

      // tslint:disable max-line-length
      expect(Adapter.pruneRefinements(navigations, storeSection, state)).to.eql([
        { field: 'Adds non-selected refinement', refinements: [4], selected: [], show: [0], more: false, boolean: false },
        { field: 'Adds selected refinements', refinements: [6, 7, 4, 5, 6, 8], selected: [1, 5], show: [1, 5], more: true, boolean: false },
        { field: 'Adds selected refinement first', refinements: [8, 9], selected: [1], show: [1, 0], more: true, boolean: false },
        { field: 'Limits to max', refinements: [0, 1, 2, 3, 4], selected: [1, 2, 3, 4], show: [1, 2], more: true, boolean: false },
        { field: 'Limits to max', refinements: [0, 1, 2, 3, 4], selected: [], show: [0, 1], more: true, boolean: false },
      ]);
      // tslint:enable
      expect(max).to.be.calledWithExactly(conf);
      expect(config).to.be.calledWithExactly(state);
    });

    it('should mark which navigations are boolean type', () => {
      const storeSection = 'search';
      const nav1 = { field: 'one', refinements: [2, 4], selected: [], more: false };
      const nav2 = { field: 'two', refinements: [2, 6], selected: [], more: true };
      const nav3 = { field: 'three', refinements: [2, 3, 5], selected: [1, 2], more: false };

      const navigations: any = [ nav1, nav2, nav3];
      const state: any = {};
      const config: any = {
        navigations: {
          type: {
            one: 'toggle',
            three: 'toggle'
          }
        }
      };
      stub(ConfigAdapter, 'extractMaxRefinements').returns(2);
      stub(Selectors, 'config').withArgs(state).returns(config);

      expect(Adapter.pruneRefinements(navigations, storeSection, state)).to.eql([
        { ...nav1, show: [0, 1], boolean: true },
        { ...nav2, show: [0, 1], boolean: false },
        { ...nav3, more: true, show: [1, 2], boolean: true },
      ]);
    });

    it('should do nothing if max not truthy', () => {
      const state: any = {};
      const storeSection = 'search';
      const conf = {};
      const navigations: any = [
        { field: 'A', refinements: [4], boolean: false },
        { field: 'B', refinements: [6, 7, 4, 5, 6, 7], boolean: false },
        { field: 'C', refinements: [8, 9], more: true, boolean: false }
      ];
      stub(ConfigAdapter, 'extractMaxRefinements');
      stub(Selectors, 'config').returns(conf);
      stub(ConfigAdapter, 'extractToggleNavigations').returns([]);

      expect(Adapter.pruneRefinements(navigations, storeSection, state)).to.eql(navigations);
    });

    it('should extract the max past purchase refinements', () => {
      const state: any = {};
      const storeSection = 'pastPurchases';
      const conf = {};
      const extractStub = stub(ConfigAdapter, 'extractMaxPastPurchaseRefinements');
      stub(ConfigAdapter, 'extractToggleNavigations').returns([]);
      stub(Selectors, 'config').returns({});

      Adapter.pruneRefinements([], storeSection, state);

      expect(extractStub).to.be.calledWith(conf);
    });
  });

  describe('combineNavigations()', () => {
    it('should merge selected and available refinements', () => {
      const availableNavigation = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
      const extractedAvailable = [
        { name: 'A', refinements: [4, 5] },
        { name: 'B', refinements: [6, 7] },
        { name: 'C', refinements: [8, 9] }
      ];
      const selectedNavigation = [{ name: 'b', refinements: [1] }, { name: 'd', refinements: [2] }];
      const extractNavigation = stub(Adapter, 'extractNavigation').callsFake((nav) => {
        if (availableNavigation.includes(nav)) {
          return extractedAvailable[availableNavigation.indexOf(nav)];
        } else {
          return { name: 'x', refinements: [1, 2, 3] };
        }
      });
      const mergeSelectedRefinements = stub(Adapter, 'mergeSelectedRefinements');

      const merged = Adapter.combineNavigations(<any>{ availableNavigation, selectedNavigation });

      expect(merged).to.eql([
        { name: 'x', refinements: [1, 2, 3], selected: [0, 1, 2] },
        ...extractedAvailable,
      ]);
      expect(mergeSelectedRefinements).to.be.calledWith(extractedAvailable[1], selectedNavigation[0]);
      expect(extractNavigation).to.have.callCount(4)
        .and.calledWith(availableNavigation[0])
        .and.calledWith(availableNavigation[1])
        .and.calledWith(availableNavigation[2])
        .and.calledWith(selectedNavigation[1]);
    });
  });

  describe('extractZone()', () => {
    it('should extract a content zone', () => {
      const content = 'Canada Day Sale!';
      const name = 'my zone';
      const zone: any = { type: 'Content', name, content };

      expect(Adapter.extractZone(zone)).to.eql({ type: 'content', name, content });
    });

    it('should extract a rich content zone', () => {
      const content = 'Canada Day Sale!';
      const name = 'my zone';
      const zone: any = { type: 'Rich_Content', name, richContent: content };

      expect(Adapter.extractZone(zone)).to.eql({
        type: 'rich_content',
        name,
        content
      });
    });

    it('should extract a record zone', () => {
      const records = [{ allMeta: { a: 'b' } }, { allMeta: { c: 'd' } }];
      const name = 'my zone';
      const query = 'red leather';
      const zone: any = { type: 'Record', name, records, query };

      expect(Adapter.extractZone(zone)).to.eql({
        type: 'products',
        name,
        query,
        products: [{ a: 'b' }, { c: 'd' }],
      });
    });
  });

  describe('extractTemplate()', () => {
    it('should convert template structure', () => {
      const template: any = {
        name: 'banner',
        ruleName: 'my rule',
        zones: {
          'zone 1': 'a',
          'zone 2': 'b',
        },
      };
      const extractZone = stub(Adapter, 'extractZone').returns('x');

      expect(Adapter.extractTemplate(template)).to.eql({
        name: 'banner',
        rule: 'my rule',
        zones: {
          'zone 1': 'x',
          'zone 2': 'x',
        },
      });
      expect(extractZone).to.be.calledWith('a')
        .and.calledWith('b');
    });

    it('should default to template with no zones', () => {
      expect(Adapter.extractTemplate()).to.eql({
        name: undefined,
        rule: undefined,
        zones: {}
      });
    });
  });

  describe('extractPage()', () => {
    it('should build page information', () => {
      const current = 4;
      const previous = 7;
      const next = 2;
      const last = 80;
      const from = 17;
      const to = 30;
      const size = 21;
      const total = 999;
      const state: any = { a: 'b' };
      const pageSize = stub(Selectors, 'pageSize').returns(size);
      const page = stub(Selectors, 'page').returns(current);
      const finalPage = stub(PageAdapter, 'finalPage').returns(last);
      const fromResult = stub(PageAdapter, 'fromResult').returns(from);
      const toResult = stub(PageAdapter, 'toResult').returns(to);
      const nextPage = stub(PageAdapter, 'nextPage').returns(next);
      const previousPage = stub(PageAdapter, 'previousPage').returns(previous);

      const pageInfo = Adapter.extractPage(state, total);

      expect(pageInfo).to.eql({
        from,
        to,
        last,
        next,
        previous,
        current: 4,
      });
      expect(pageSize).to.be.calledWith(state);
      expect(page).to.be.calledWith(state);
      expect(finalPage).to.be.calledWith(size, total);
      expect(fromResult).to.be.calledWith(current, size);
      expect(toResult).to.be.calledWith(current, size, total);
      expect(nextPage).to.be.calledWith(current, last);
      expect(previousPage).to.be.calledWith(current);
    });

    it('should build page information when pastPurchase is true', () => {
      const current = 4;
      const previous = 7;
      const next = 2;
      const last = 80;
      const from = 17;
      const to = 30;
      const size = 21;
      const total = 999;
      const state: any = { a: 'b' };
      const pastPurchasePageSize = stub(Selectors, 'pastPurchasePageSize').returns(size);
      const pastPurchasePage = stub(Selectors, 'pastPurchasePage').returns(current);
      const finalPage = stub(PageAdapter, 'finalPage').returns(last);
      const fromResult = stub(PageAdapter, 'fromResult').returns(from);
      const toResult = stub(PageAdapter, 'toResult').returns(to);
      const nextPage = stub(PageAdapter, 'nextPage').returns(next);
      const previousPage = stub(PageAdapter, 'previousPage').returns(previous);

      const pageInfo = Adapter.extractPage(state, total, pastPurchasePage(state), pastPurchasePageSize(state));

      expect(pageInfo).to.eql({
        from,
        to,
        last,
        next,
        previous,
        current
      });
      expect(pastPurchasePageSize).to.be.calledWith(state);
      expect(pastPurchasePage).to.be.calledWith(state);
      expect(finalPage).to.be.calledWith(size, total);
      expect(fromResult).to.be.calledWith(current, size);
      expect(toResult).to.be.calledWith(current, size, total);
      expect(nextPage).to.be.calledWith(current, last);
      expect(previousPage).to.be.calledWith(current);
    });
  });

  describe('extractData()', () => {
    it('should return data', () => {
      const prod1 = { a: 'b' };
      const prod2 = { c: 'd' };
      const prod3 = { e: 'f' };
      const products: any = [
        { index: 2, meta: {}, data: prod1 },
        { index: 3, meta: {}, data: prod2 },
        { index: 4, meta: {}, data: prod3 },
      ];

      expect(Adapter.extractData(products)).to.eql([prod1, prod2, prod3]);
    });
  });

  describe('extractAllMeta()', () => {
    const product = { a: 'b' };

    it('should return product allMeta', () => {
      expect(Adapter.extractAllMeta(<any>{ allMeta: product })).to.eq(product);
    });

    it('should return product', () => {
      expect(Adapter.extractAllMeta(<any>product)).to.eq(product);
    });
  });

  describe('augmentProducts()', () => {
    it('should return the products remapped, with data, meta, and index', () => {
      const purchase1 = 'idk';
      const purchase2 = 'another one';
      const allMeta1 = { a: 'b' };
      const allMeta2 = { c: 'd' };
      const allMeta3 = { e: 'f' };
      const collection1 = 'heyy';
      const collection2 = 'heyyo';
      const collection3 = 'heyyoeh';
      const results: any = {
        records: [
          { allMeta: allMeta1, collection: collection1 },
          { allMeta: allMeta2, collection: collection2 },
          { allMeta: allMeta3, collection: collection3 },
        ],
        pageInfo: {
          recordStart: 1,
        }
      };
      const extracted = [
        { data: allMeta1, index: 1, meta: { collection: collection1 } },
        { data: allMeta2, index: 2, meta: { collection: collection2 } },
        { data: allMeta3, index: 3, meta: { collection: collection3 } },
      ];

      expect(Adapter.augmentProducts(results)).to.eql(extracted);
    });
  });

  describe('extractRecordCount()', () => {
    it('should return the totalRecordCount', () => {
      const totalRecordCount = 43;

      expect(Adapter.extractRecordCount(totalRecordCount)).to.eq(totalRecordCount);
    });

    it('should return the maximum total record count', () => {
      expect(Adapter.extractRecordCount(MAX_RECORDS + 1)).to.eq(MAX_RECORDS);
    });
  });
});
