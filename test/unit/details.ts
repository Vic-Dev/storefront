import { Events, ProductTransformer } from '@storefront/core';
import Details from '../../src/details';
import suite from './_suite';

const STRUCTURE = { a: 'b' };

suite('Details', ({ expect, spy, stub, itShouldBeConfigurable, itShouldHaveAlias }) => {
  let details: Details;

  beforeEach(() => {
    Details.prototype.config = <any>{ structure: STRUCTURE };
    details = new Details();
  });
  afterEach(() => delete Details.prototype.config);

  itShouldBeConfigurable(Details);
  itShouldHaveAlias(Details, 'details');

  describe('constructor()', () => {
    it('should set initial values', () => {
      expect(details.structure).to.eq(STRUCTURE);
    });
  });

  describe('init()', () => {
    it('should listen for DETAILS_UPDATED', () => {
      const subscribe = details.subscribe = spy();
      details.select = spy();

      details.init();

      expect(subscribe).to.be.calledWithExactly(Events.DETAILS_UPDATED, details.updateDetails);
    });

    it('should call details selector and call updateDetails with details.product', () => {
      const data = { a: 1 };
      const updateDetails = stub(details, 'updateDetails');
      details.subscribe = () => null;
      details.select = spy(() => ({ data }));

      details.init();

      expect(updateDetails).to.be.calledWithExactly(data);
    });
  });

  describe('updateDetails()', () => {
    it('should update product', () => {
      const product: any = { a: 'b' };
      const transformed = { c: 'd' };
      const update = details.update = spy();
      const transform = stub(ProductTransformer, 'transform').returns(transformed);

      details.updateDetails(product);

      expect(update).to.be.calledWithExactly({ product: transformed });
      expect(transform).to.be.calledWithExactly(product, STRUCTURE);
    });

    it('should update product to be empty', () => {
      const transformed = { c: 'd' };
      const update = details.update = spy();
      stub(ProductTransformer, 'transform').callsFake(() => expect.fail());

      details.updateDetails(undefined);

      expect(update).to.be.calledWithExactly({ product: { data: {}, variants: [{}] } });
    });
  });
});
