import { Events, Selectors } from '@storefront/core';
import * as sinon from 'sinon';
import Autocomplete from '../../src/autocomplete';
import suite from './_suite';

const CATEOGORY = 'brand';
const CATEOGORY_VALUES = ['a', 'b', 'c'];
const SUGGESTIONS = ['d', 'e', 'f'];
const NAVIGATIONS = ['g', 'h', 'i'];
const STATE = { h: 'j' };

suite('Autocomplete', ({ expect, spy, stub }) => {
  let autocomplete: Autocomplete;
  let autocompleteSuggestionsSelector: sinon.SinonStub;
  let autocompleteCategoryFieldSelector: sinon.SinonStub;
  let autocompleteCategoryValuesSelector: sinon.SinonStub;
  let autocompleteNavigationsSelector: sinon.SinonStub;

  beforeEach(() => {
    Autocomplete.prototype.flux = <any>{ store: { getState: () => STATE } };
    autocompleteSuggestionsSelector = stub(Selectors, 'autocompleteSuggestions').returns(SUGGESTIONS);
    autocompleteCategoryFieldSelector = stub(Selectors, 'autocompleteCategoryField').returns(CATEOGORY);
    autocompleteCategoryValuesSelector = stub(Selectors, 'autocompleteCategoryValues').returns(CATEOGORY_VALUES);
    autocompleteNavigationsSelector = stub(Selectors, 'autocompleteNavigations').returns(NAVIGATIONS);
    autocomplete = new Autocomplete();
  });
  afterEach(() => delete Autocomplete.prototype.flux);

  describe('constructor()', () => {
    describe('state', () => {
      it('should set initial value', () => {
        expect(autocomplete.state).to.eql({
          onHover: autocomplete.state.onHover,
          selected: -1,
          category: CATEOGORY,
          categoryValues: CATEOGORY_VALUES,
          suggestions: SUGGESTIONS,
          navigations: NAVIGATIONS
        });
      });
    });
  });

  describe('init()', () => {
    it('should listen for flux events', () => {
      const on = spy();
      autocomplete.flux = <any>{ on };
      autocomplete.services = <any>{ autocomplete: { registerAutocomplete: () => null } };

      autocomplete.init();

      expect(on).to.have.callCount(4)
        .and.calledWith(Events.AUTOCOMPLETE_SUGGESTIONS_UPDATED, autocomplete.updateSuggestions)
        .and.calledWith('sayt:activate_next', autocomplete.activateNext)
        .and.calledWith('sayt:activate_previous', autocomplete.activatePrevious)
        .and.calledWith('sayt:select_active', autocomplete.selectActive);
    });

    it('should register with autocomplete service', () => {
      const registerAutocomplete = spy();
      autocomplete.services = <any>{ autocomplete: { registerAutocomplete } };
      autocomplete.flux = <any>{ on: () => null };

      autocomplete.init();

      expect(registerAutocomplete).to.be.calledWith(autocomplete);
    });
  });

  describe('activationTargets()', () => {
    it('should return a NodeList of .gb-autocomplete-target elements', () => {
      const targets = ['a', 'b'];
      const querySelectorAll = spy(() => targets);
      autocomplete.root = <any>{ querySelectorAll };

      const selected = autocomplete.activationTargets();

      expect(selected).to.eq(targets);
      expect(querySelectorAll).to.be.calledWith('.gb-autocomplete-target');
    });
  });

  describe('activateNext()', () => {
    const targets = ['a', 'b', 'c'];

    it('should deactivate old target if it exists', () => {
      const selected = 1;
      const setActivation = autocomplete.setActivation = spy();
      autocomplete.state = <any>{ selected };
      autocomplete.activationTargets = (): any => targets;
      autocomplete.isActive = () => true;

      autocomplete.activateNext();

      expect(setActivation).to.be.calledTwice
        .and.calledWith(targets, selected, false)
        .and.calledWith(targets, selected + 1, true);
    });

    it('should only activate next if no old target exists', () => {
      const selected = 1;
      const setActivation = autocomplete.setActivation = spy();
      autocomplete.state = <any>{ selected };
      autocomplete.activationTargets = (): any => targets;
      autocomplete.isActive = () => false;

      autocomplete.activateNext();

      expect(setActivation).to.be.calledOnce
        .and.calledWith(targets, selected + 1, true);
    });

    it('should not move activation if at end of targets', () => {
      autocomplete.setActivation = () => expect.fail();
      autocomplete.state = <any>{ selected: 2 };
      autocomplete.activationTargets = (): any => targets;

      autocomplete.activateNext();
    });
  });

  describe('activatePrevious()', () => {
    const targets = ['a', 'b', 'c'];

    it('should deactivate old target if it exists', () => {
      const selected = 1;
      const setActivation = autocomplete.setActivation = spy();
      autocomplete.state = <any>{ selected };
      autocomplete.activationTargets = (): any => targets;
      autocomplete.isActive = () => true;

      autocomplete.activatePrevious();

      expect(setActivation).to.be.calledTwice
        .and.calledWith(targets, selected, false)
        .and.calledWith(targets, selected - 1, true);
    });

    it('should not change activate element if no current active element', () => {
      autocomplete.setActivation = () => expect.fail();
      autocomplete.activationTargets = (): any => targets;
      autocomplete.isActive = () => false;

      autocomplete.activatePrevious();
    });
  });

  describe('selectActive()', () => {
    it('should click anchor tag in selected element', () => {
      const click = spy();
      const querySelector = spy(() => ({ click }));
      const set = autocomplete.set = spy();
      autocomplete.state = <any>{ selected: 1 };
      autocomplete.activationTargets = (): any => [{}, { querySelector }, {}];
      autocomplete.isActive = () => true;

      autocomplete.selectActive();

      expect(querySelector).to.be.calledWith('a');
      expect(click).to.be.called;
      expect(set).to.be.calledWith({ selected: -1 });
    });

    it('should not remove selection if no active element', () => {
      autocomplete.set = () => expect.fail();
      autocomplete.isActive = () => false;

      autocomplete.selectActive();
    });
  });

  describe('updateSuggestions()', () => {
    const suggestions = ['1', '2', '3'];
    const navigations = ['4', '5', '6'];
    const categoryValues = ['7', '8', '9'];

    it('should set values and not change activation', () => {
      const set = autocomplete.set = spy();
      autocomplete.flux = <any>{ emit: () => null };
      autocomplete.isActive = () => false;
      autocomplete.setActivation = () => expect.fail();

      autocomplete.updateSuggestions(<any>{ suggestions, navigations, category: { values: categoryValues } });

      expect(set).to.be.calledWith({ suggestions, navigations, categoryValues, selected: -1 });
    });

    it('should not change activation if not mounted', () => {
      const set = autocomplete.set = spy();
      autocomplete.flux = <any>{ emit: () => null };
      autocomplete.isActive = () => true;
      autocomplete.isMounted = false;
      autocomplete.setActivation = () => expect.fail();

      autocomplete.updateSuggestions(<any>{ suggestions, navigations, category: { values: categoryValues } });
    });

    it('should deactivate selected element', () => {
      const selected = 1;
      const targets = ['a', 'b', 'c'];
      const set = autocomplete.set = spy();
      const setActivation = autocomplete.setActivation = spy();
      autocomplete.flux = <any>{ emit: () => null };
      autocomplete.activationTargets = (): any => targets;
      autocomplete.state = <any>{ selected };
      autocomplete.isActive = () => true;
      autocomplete.isMounted = true;

      autocomplete.updateSuggestions(<any>{ suggestions, navigations, category: { values: categoryValues } });

      expect(set).to.be.calledWith({ suggestions, navigations, categoryValues, selected: -1 });
      expect(setActivation).to.be.calledWith(targets, selected, false);
    });

    it('should inactivate sayt when there are no suggestions', () => {
      const emit = spy();
      autocomplete.flux = <any>{ emit };
      autocomplete.set = () => null;

      autocomplete.updateSuggestions(<any>{ suggestions: [], navigations: [], category: { values: [] } });

      expect(emit).to.be.calledWith('sayt:hide');
    });

    it('should activate sayt when there are suggestions', () => {
      const emit = spy();
      autocomplete.flux = <any>{ emit };
      autocomplete.set = () => null;

      autocomplete.updateSuggestions(<any>{ suggestions, navigations, category: { values: categoryValues } });

      expect(emit).to.be.calledWith('sayt:show');
    });
  });

  describe('setActivation()', () => {
    it('should not toggle gb-active if selected is -1', () => {
      const index = -1;
      const state = autocomplete.state = <any>{ selected: 4 };
      autocomplete.updateProducts = () => null;

      autocomplete.setActivation(<any>[], index, true);

      expect(state.selected).to.eq(index);
    });

    it('should add gb-active to classList if activating and update state', () => {
      const add = spy();
      const target = { classList: { add } };
      const state = autocomplete.state = <any>{ selected: 4 };
      const updateProducts = autocomplete.updateProducts = spy();

      autocomplete.setActivation(<any>[{}, target, {}], 1, true);

      expect(add).to.be.calledWith('gb-active');
      expect(state.selected).to.eq(1);
      expect(updateProducts).to.be.calledWith(target);
    });

    it('should remove gb-active from classList if deactivating', () => {
      const remove = spy();
      const selected = 4;
      const state = autocomplete.state = <any>{ selected };
      autocomplete.updateProducts = () => null;

      autocomplete.setActivation(<any>[{}, { classList: { remove } }, {}], 1, false);

      expect(remove).to.be.calledWith('gb-active');
      expect(state.selected).to.eq(selected);
    });
  });

  describe('updateProducts()', () => {
    const query = 'salad';

    it('should emit query:update event', () => {
      const emit = spy();
      autocomplete.flux = <any>{ emit, saytProducts: () => null };

      autocomplete.updateProducts(<any>{ dataset: { query } });

      expect(emit).to.be.calledWithExactly('query:update', query);
    });

    it('should call flux.saytProducts() with only query', () => {
      const saytProducts = spy();
      autocomplete.flux = <any>{ emit: () => null, saytProducts };

      autocomplete.updateProducts(<any>{ dataset: { query } });

      expect(saytProducts).to.be.calledWithExactly(query, []);
    });

    it('should call flux.saytProducts() with original query', () => {
      const saytProducts = spy();
      const state = { a: 'b' };
      const querySelector = stub(Selectors, 'autocompleteQuery').returns(query);
      autocomplete.flux = <any>{ emit: () => null, saytProducts, store: { getState: () => state } };

      autocomplete.updateProducts(<any>{ dataset: {} });

      expect(saytProducts).to.be.calledWithExactly(query, []);
      expect(querySelector).to.be.calledWith(state);
    });

    it('should call flux.saytProducts() with only refinement', () => {
      const refinement = 'Nike';
      const field = 'brand';
      const saytProducts = spy();
      autocomplete.flux = <any>{ emit: () => null, saytProducts };

      autocomplete.updateProducts(<any>{ dataset: { query, refinement, field } });

      expect(saytProducts).to.be.calledWithExactly('', [{ field, value: refinement }]);
    });

    it('should call flux.saytProducts() with query and category refinement', () => {
      const refinement = 'Nike';
      const category = 'brand';
      const saytProducts = spy();
      autocomplete.state = <any>{ category };
      autocomplete.flux = <any>{ emit: () => null, saytProducts };

      autocomplete.updateProducts(<any>{ dataset: { query, refinement } });

      expect(saytProducts).to.be.calledWithExactly(query, [{ field: category, value: refinement }]);
    });
  });

  describe('isActive()', () => {
    it('should return true if there is an active selection', () => {
      autocomplete.state = <any>{ selected: 3 };

      expect(autocomplete.isActive()).to.be.true;
    });

    it('should return false if there is no active selection', () => {
      autocomplete.state = <any>{ selected: -1 };

      expect(autocomplete.isActive()).to.be.false;
    });
  });
});