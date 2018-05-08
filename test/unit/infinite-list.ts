import InfiniteList from '../../src/infinite-list';
import List from '../../src/list';
import suite from './_suite';

suite('InfiniteList', ({ expect, spy }) => {
  let infiniteList: InfiniteList;

  beforeEach(() => infiniteList = new InfiniteList());

  describe('inheritance', () => {
    it('should extend List', () => {
      expect(infiniteList).to.be.an.instanceOf(List);
    });
  });
});
