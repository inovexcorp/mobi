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
import { of } from 'rxjs';
import { MockProvider } from 'ng-mocks';

import { LoginManagerService } from './shared/services/loginManager.service';
import { AuthenticationHomeGuard } from './authenticationHome.guard';

describe('AuthenticationHomeGuard', () => {
  let guard: AuthenticationHomeGuard;
  let loginManagerStub: jasmine.SpyObj<LoginManagerService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthenticationHomeGuard,
        MockProvider(LoginManagerService)
      ]
    });
    loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
    guard = TestBed.inject(AuthenticationHomeGuard);
  });

  it('should return true when session is valid', (done) => {
    loginManagerStub.validateSession.and.returnValue(of(true));

    guard.canActivate().subscribe((canActivate) => {
      expect(canActivate).toBeTrue();
      done();
    });
  });
  it('should return false when session is not valid', (done) => {
    loginManagerStub.validateSession.and.returnValue(of(false));

    guard.canActivate().subscribe((canActivate) => {
      expect(canActivate).toBeFalse();
      done();
    });
  });
  it('should call validateSession from LoginManagerService', (done) => {
    loginManagerStub.validateSession.and.returnValue(of(true));

    guard.canActivate().subscribe(() => {
      expect(loginManagerStub.validateSession).toHaveBeenCalled();
      done();
    });
  });
});
