/**
 * ispired by https://github.com/robinvdvleuten/vuex-persistedstate
 */

import merge from 'deepmerge';
import shvl from 'shvl';
import { Plugin, Store } from 'vuex';

export interface IVuexPersistOption {
  store?: Storage;
  subscriber?: any;
  filter?: (mutation: any) => {};
  setState?: (key: any, state: any, storage: any) => {};
  reducer?: (state: any) => {};
  whitelist?: string[];
  prefix?: string;
}

export const VuexPersist = (options: IVuexPersistOption[] = [] as IVuexPersistOption[]): Plugin<any> => {
  const canWriteStorage = (store: Storage) => {
    try {
      store.setItem('@@', '1');
      store.removeItem('@@');
      return true;
    } catch (e) {
      return false;
    }
  };
  const getState = (key: any, store: Storage, value: any) => {
    value = store.getItem(key);

    try {
      return value && value !== 'undefined' ? JSON.parse(value) : undefined;
    } catch (e) {
      return undefined;
    }
  };
  const filter = () => {
    return true;
  };
  const setState = (key: string, state: any, store: Storage) => {
    return store.setItem(key, JSON.stringify(state));
  };
  const reducer = (state: any) => {
    return state;
  };
  const subscriber = (store: Storage) => {
    return (handler: any) => {
      return store.subscribe(handler);
    };
  };

  return (vuexStore: Store<any>) => {
    const hydratedState: any = {};

    /**
     * merge saved state from store into initial store
     */

    options.forEach((option: IVuexPersistOption): void => {
      option.prefix = option.prefix || 'vuex-persist';
      option.whitelist = option.whitelist || [];

      if (canWriteStorage(option.store)) {

        option.whitelist.forEach((key: string) => {
          const savedState: any = shvl.get(option.store, 'getState', getState)(key, option.store);

          if (savedState && Object.keys(savedState).length > 0) {
            hydratedState[key] = savedState;
          }

          (option.subscriber || subscriber)(vuexStore)((mutation: any, state: any) => {
            if ((option.filter || filter)(mutation)) {
              (option.setState || setState)(
                key,
                (option.reducer || reducer)(state[key]),
                option.store,
              );
            }
          });
        });
      }
    });

    const mergedState: any = merge(vuexStore.state, hydratedState, {
      clone: false,
      arrayMerge: (store, saved) => {
        return saved;
      },
    });

    vuexStore.replaceState(mergedState);
  };
};
