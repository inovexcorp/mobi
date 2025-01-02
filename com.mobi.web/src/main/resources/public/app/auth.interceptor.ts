/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Injectable, Injector, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpStatusCode
} from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { LoginManagerService } from './shared/services/loginManager.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private loginManagerService: LoginManagerService;

  constructor(
    private injector: Injector,
    private router: Router,
    private ngZone: NgZone) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.injectDependencies();
    const routerStateSnapshot = this.router.routerState.snapshot;
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.Unauthorized && routerStateSnapshot.url !== '/login') {
              return this.ngZone.run(() => {
                  return this.loginManagerService.validateSession().pipe(
                      switchMap((isValid: boolean) => {
                          if (isValid) {
                              return throwError(error);
                          } else {
                              return EMPTY;
                          }
                      })
                  );
              });
          } else {
              return throwError(error);
          }
      })
    );
  }
  
  /**
   * Inject Dependencies
   * Manually retrieve the services to avoid circular dependencies
   */
  private injectDependencies() {
    if (!this.loginManagerService) {
      this.loginManagerService = this.injector.get(LoginManagerService);
    }
  }
}
