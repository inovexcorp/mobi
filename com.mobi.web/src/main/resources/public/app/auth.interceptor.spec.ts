/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { NgZone } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';

import { AuthInterceptor } from './auth.interceptor';
import { LoginManagerService } from './shared/services/loginManager.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let loginManagerService: jasmine.SpyObj<LoginManagerService>;
  let ngZone: NgZone;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        AuthInterceptor,
        MockProvider(LoginManagerService)
      ]
    });

    loginManagerService = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
    ngZone = TestBed.inject(NgZone);
    interceptor = TestBed.inject(AuthInterceptor);
  });

  afterEach(() => {
    loginManagerService = null;
    ngZone = null;
    interceptor = null;
  });

  it('should return object if validateSession is true and after 401 error ', () => {
    const mockRequest = { method: 'GET', url: '/api/test' };
    const errorMessage = 'Network error';

    loginManagerService.validateSession.and.returnValue(of(true));

    interceptor.intercept(mockRequest as any, {
      handle: () => throwError(new HttpErrorResponse({ error: errorMessage, status: 401 }))
    }).subscribe({
      next: () => fail('Expected an error response'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
        expect(error.error).toBe(errorMessage);
      }
    });
  });
  it('should return EMPTY observable if session is invalid after 401 error', () => {
    const mockRequest = { method: 'GET', url: '/api/test' };
    loginManagerService.validateSession.and.returnValue(of(false));

    interceptor.intercept(mockRequest as any, {
      handle: () => throwError(new HttpErrorResponse({ status: HttpStatusCode.Unauthorized }))
    }).subscribe(response => {
      expect(response).toBeUndefined();
    });
  });
  it('should throw error for other HTTP errors', () => {
    const mockRequest = { method: 'GET', url: '/api/test' };
    const errorMessage = 'Network error';

    interceptor.intercept(mockRequest as any, {
      handle: () => throwError(new HttpErrorResponse({ error: errorMessage, status: 500 }))
    }).subscribe({
      next: () => fail('Expected an error response'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
        expect(error.error).toBe(errorMessage);
      }
    });
  });
});
