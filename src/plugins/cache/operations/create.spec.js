import sinon from 'sinon';
import {decorateCreate} from './create';
import {createCache, getEntity} from '../cache';
import {createApiFunction} from '../test-helper';

const curryNoop = () => () => {};

const config = [
  {
    name: 'user',
    ttl: 300,
    api: {
      getUsers: (x) => x,
      getUsers2: (x) => x,
      deleteUser: (x) => x
    },
    invalidates: ['user'],
    invalidatesOn: ['GET']
  },
  {
    name: 'userPreview',
    ttl: 200,
    api: {
      getPreviews: (x) => x,
      updatePreview: (x) => x
    },
    invalidates: ['fda'],
    viewOf: 'user'
  },
  {
    name: 'listUser',
    ttl: 200,
    api: {
      getPreviews: (x) => x,
      updatePreview: (x) => x
    },
    invalidates: ['fda'],
    viewOf: 'user'
  }
];

describe('Create', () => {
  describe('decorateCreate', () => {
    it('Adds value to entity store', (done) => {
      const cache = createCache(config);
      const e = config[0];
      const xOrg = {name: 'Kalle'};
      const response = {...xOrg, id: 1};
      const aFnWithoutSpy = createApiFunction(() => Promise.resolve(response));
      const aFn = sinon.spy(aFnWithoutSpy);
      const res = decorateCreate({}, cache, curryNoop, e, aFn);
      res(xOrg).then((newX) => {
        expect(newX).to.equal(response);
        expect(getEntity(cache, e, 1).value).to.deep.equal({...response, __ladda__id: 1});
        done();
      });
    });
  });
});