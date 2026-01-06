import { Elysia } from 'elysia';
import { getHomeHTML } from './home.view.ts';

export const homeController = new Elysia()
  .get('/', ({ set }) => {
    set.headers['Content-Type'] = 'text/html; charset=utf-8';
    return getHomeHTML();
  });
