import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IBreadcrumb } from './ngx-breadcrumb.types';
import { NgxBreadcrumbService } from './ngx-breadcrumb.service';

@Component({
  selector: 'ngx-breadcrumb',
  templateUrl: './ngx-breadcrumb.component.html',
  styleUrls: ['./ngx-breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxBreadcrumbComponent implements OnInit, OnDestroy {
  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly service: NgxBreadcrumbService
  ) {}

  @Input()
  breadcrumbTemplate: TemplateRef<IBreadcrumb> | null = null;

  breadcrumbs: IBreadcrumb[] = [];
  private _subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this._subscriptions.push(
      this.service.breadcrumbUpdate$.subscribe((crumbs) => {
        this.breadcrumbs = crumbs;
        this.cdr.detectChanges();
      }),
      this.service.breadcrumbReplace$.subscribe((crumb) => {
        crumb.forEach((item) => {
          const data = this.breadcrumbs.find(
            (breadcrumb) => breadcrumb.key === item.key
          );
          if (data) {
            data.label = item.newLabel;
            data.url = Array.isArray(item.newUrl)
              ? item.newUrl.join('/')
              : item.newUrl ?? data.url;
          }
        });
        this.cdr.detectChanges();
      })
    );
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((subs) => subs.unsubscribe());
  }
}