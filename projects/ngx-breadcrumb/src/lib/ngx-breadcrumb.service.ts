import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { IBreadcrumb, IReplaceBreadcrumb } from './ngx-breadcrumb.types';

@Injectable()
export class NgxBreadcrumbService {
  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {
    this._subscribeToRouteEvent();
  }

  private breadcrumbs: IBreadcrumb[] = [];

  private readonly _breadcrumbChanges = new BehaviorSubject<IBreadcrumb[]>([]);

  /**
   * Emit change when the breadcrumbs are changed.
   */
  readonly breadcrumbChanges = this._breadcrumbChanges.asObservable();

  /**
   * Recursively build breadcrumb according to activated route.
   * @param route activate route object
   * @param url parent url
   * @param breadcrumbs array of current breadcrumbs
   */
  buildBreadCrumb(
    route: ActivatedRoute,
    url = '',
    breadcrumbs: IBreadcrumb[] = []
  ): IBreadcrumb[] {
    // If no routeConfig is available we are on the root path
    let label, key, tooltip;
    let isClickable = true;
    const currentBreadcrumb = route.routeConfig?.data?.breadcrumb;
    if (typeof currentBreadcrumb === 'object') {
      key = currentBreadcrumb.key;
      label = currentBreadcrumb.label;
      isClickable = currentBreadcrumb.isClickable ?? isClickable;
      tooltip = currentBreadcrumb.tooltip ?? label;
    } else if (typeof currentBreadcrumb === 'string') {
      key = label = tooltip = currentBreadcrumb;
    }
    let path = route.routeConfig?.path ?? '';

    // If the route is dynamic route such as ':id', replace it with actual param values
    const dynamicRoutes = path!.split('/').filter((el) => el.startsWith(':'));
    if (dynamicRoutes.length && !!route.snapshot) {
      dynamicRoutes.forEach((item) => {
        const paramName = item.split(':')[1];
        path = path!.replace(item, route.snapshot.params[paramName]);
      });
    }

    // In the routeConfig the complete path is not available,
    //so we rebuild it each time
    const nextUrl = path ? `${url}/${path}` : url;

    const newBreadcrumbs = [...breadcrumbs];

    if (key) {
      const breadcrumb: IBreadcrumb = {
        key,
        label,
        tooltip,
        url: nextUrl,
        isClickable,
      };

      // Only adding route with non-empty label
      newBreadcrumbs.push(breadcrumb);
    }

    if (route.firstChild) {
      //If we are not on our current path yet,
      //there will be more children to look after, to build our breadcrumb
      return this.buildBreadCrumb(route.firstChild, nextUrl, newBreadcrumbs);
    }
    return newBreadcrumbs;
  }

  /**
   * Returns the latest array of breadcrumbs.
   * @returns Array of breadcrumbs
   */
  public getBreadcrumbs(): IBreadcrumb[] {
    return this._breadcrumbChanges.getValue();
  }

  /**
   * Edit the breadcrumb label and url dynamically.
   * If the label is null while editing, it will act
   * as delete breadcrumb from UI.
   * @param {Array} crumbs IReplaceBreadcrumb[]
   */
  editBreadcrumbs(crumbs: IReplaceBreadcrumb[]): void {
    crumbs.forEach((item) => {
      const data = this.breadcrumbs.find(
        (breadcrumb) => breadcrumb.key === item.key
      );
      if (data) {
        data.label = item.newLabel;
        data.url = Array.isArray(item.newUrl)
          ? item.newUrl.join('/')
          : item.newUrl ?? data.url;
        data.tooltip = item.tooltip ?? data.tooltip;
      }
    });
    this._breadcrumbChanges.next([...this.breadcrumbs]);
  }

  // private functions
  private _subscribeToRouteEvent() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadCrumb(this.activatedRoute.root);
        this._breadcrumbChanges.next(this.breadcrumbs);
      });
  }
}
