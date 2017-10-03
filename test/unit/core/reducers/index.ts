import Actions from '../../../../src/core/actions';
import reducer, * as reducers from '../../../../src/core/reducers';
import suite from '../../_suite';

suite('reducers', ({ expect, stub }) => {
  it('should handle REFRESH_STATE action', () => {
    const payload = { a: 'b', data: { past: [], present: { autocomplete: { c: 'd' }, details: {} }, future: [] } };
    const newState = {
      a: 'b',
      session: undefined,
      data: {
        past: [{ autocomplete: { c: 'd' }, details: {} }],
        present: { autocomplete: {}, details: { data: undefined } },
        future: []
      }
    };

    expect(reducer(<any>{
      data: {
        past: [],
        present: { autocomplete: {}, details: {} },
        future: []
      }
    }, { type: Actions.REFRESH_STATE, payload })).to.eql(newState);
  });

  it('should return default', () => {
    const state = { a: 'b' };
    stub(reducers, 'rootReducer').returns(state);

    expect(reducer(<any>{}, <any>{ type: '' })).to.eq(state);
  });
});