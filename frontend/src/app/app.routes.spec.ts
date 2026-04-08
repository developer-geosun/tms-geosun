import { routes } from './app.routes';
describe('app routes', () => {
  it('uses lazy loaded components for app pages', () => {
    const mainRoute = routes.find((route) => route.path === 'main');
    const stopServiceRoute = routes.find((route) => route.path === 'stop-service');
    const notFoundRoute = routes.find((route) => route.path === '404');

    expect(mainRoute?.loadComponent).toBeDefined();
    expect(stopServiceRoute?.loadComponent).toBeDefined();
    expect(notFoundRoute?.loadComponent).toBeDefined();
    expect(mainRoute?.component).toBeUndefined();
    expect(stopServiceRoute?.component).toBeUndefined();
    expect(notFoundRoute?.component).toBeUndefined();
  });
});
