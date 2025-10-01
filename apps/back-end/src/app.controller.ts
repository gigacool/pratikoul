import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiDiscovery() {
    return {
      name: 'Metrics & KPI API',
      version: '1.0.0',
      description: 'RESTful API for managing business metrics, KPIs, and dashboards',
      _links: {
        self: { href: '/' },
        register: {
          href: '/auth/register',
          title: 'Public registration endpoint (creates viewer account)',
          method: 'POST'
        },
        login: {
          href: '/auth/login',
          title: 'Authentication endpoint',
          method: 'POST'
        },
        users: {
          href: '/users',
          title: 'Users collection (requires authentication)',
          protected: true
        },
        metrics: {
          href: '/metrics',
          title: 'Metrics collection'
        },
        kpis: {
          href: '/kpis',
          title: 'KPIs collection'
        },
        dashboards: {
          href: '/dashboards',
          title: 'Dashboards collection'
        }
      }
    };
  }
}
