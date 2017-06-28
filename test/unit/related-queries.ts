import { utils, Events } from '@storefront/core';
import RelatedQueries from '../../src/related-queries';
import suite from './_suite';

suite('RelatedQueries', ({ expect, spy, stub }) => {
  let relatedQueries: RelatedQueries;

  beforeEach(() => relatedQueries = new RelatedQueries());

  describe('constructor()', () => {
    describe('state', () => {
      it('should set initial value', () => {
        expect(relatedQueries.state).to.eql({ relatedQueries: [] });
      });
    });
  });

  describe('init()', () => {
    it('should listen for RELATED_QUERIES_UPDATED', () => {
      const on = spy();
      relatedQueries.flux = <any>{ on };
      relatedQueries.expose = () => null;

      relatedQueries.init();

      expect(on).to.be.calledWith(Events.RELATED_QUERIES_UPDATED, relatedQueries.updateRelatedQueries);
    });
  });

  describe('updateRelatedQueries()', () => {
    it('should set relatedQueries', () => {
      const related: any[] = ['a', 'b'];
      const searchActions = ['c', 'd'];
      const actions = relatedQueries.actions = <any>{ e: 'f' };
      const set = relatedQueries.set = spy();
      const mapToSearchActions = stub(utils, 'mapToSearchActions').returns(searchActions);
      relatedQueries.state = <any>{ relatedQueries: [] };

      relatedQueries.updateRelatedQueries(related);

      expect(set).to.be.calledWith({ relatedQueries: searchActions });
      expect(mapToSearchActions).to.be.calledWith(related, actions);
    });

    it('should not set relatedQueries if both empty', () => {
      relatedQueries.set = () => expect.fail();
      relatedQueries.state = <any>{ relatedQueries: [] };

      relatedQueries.updateRelatedQueries([]);
    });
  });
});
