import { createApp, IApp } from '../app/app';
import { Component } from 'vue-router/types/router';
import merge from 'deepmerge';

export default (context: any) => {

  return new Promise((resolve: any, reject: any) => {
    const { app, router, store }: IApp = createApp();

    router.push(context.url);

    context.meta = app.$meta();

    /**
     * merge cookie storage into initial state
     */
    const cookieState: any = {};

    Object.keys(context.cookies).forEach((key: string) => {
      try {
        cookieState[key] = JSON.parse(context.cookies[key]);
      } catch (e) {
        cookieState[key] = {};
      }
    });

    const mergedState: any = merge(store.state, cookieState, {
      clone: false,
      arrayMerge: (initial, cookie) => {
        return cookie;
      },
    });

    store.replaceState(mergedState);

    router
      .onReady(() => {
        const matchedComponents: Component[] = router.getMatchedComponents();

        if (!matchedComponents.length) {
          return reject({ code: 404 });
        }

        Promise.all(matchedComponents.map((component: Component) => {

          if ((component as any).prefetch) {
            return (component as any).prefetch({
              store,
              route: router.currentRoute,
            });
          }

          return Promise.resolve();
        }))
          .then(() => {
            context.state = store.state;
            resolve(app);
          })
          .catch(reject);

      }, reject);
  });
};
