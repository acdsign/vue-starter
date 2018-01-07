/* tslint:disable:no-console */

import * as Cookies from 'js-cookie';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { VuexPersist } from './shared/plugins/vuex-persist';
import { actions } from './actions';
import { getters } from './getters';
import { defaultState, mutations } from './mutations';

Vue.use(Vuex);

const inBrowser: boolean = typeof window !== 'undefined';
const state: any = (inBrowser && window.__INITIAL_STATE__) || defaultState;

export const store: Store<any> = new Vuex.Store({
  state,
  actions,
  mutations,
  getters,
  plugins: [VuexPersist([
    {
      store: CLIENT ? window.localStorage : null,
      whitelist: ['home'],
    },
    {
      store: CLIENT ? {
        getItem: (key: string): string => {
          return Cookies.get(key) || '';
        },
        setItem: (key: string, value: any): void => {
          Cookies.set(key, value, { expires: 1 });
        },
        removeItem: (key: string): void => {
          Cookies.remove(key);
        },
      } as Storage : null,
      whitelist: ['counter'],
    },
  ])],
});
