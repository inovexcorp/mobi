/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Router, CanActivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { LoginManagerService } from './shared/services/loginManager.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(private loginManagerService: LoginManagerService, private router: Router) {}

    canActivate(): Observable<boolean> {
        return this.loginManagerService.isAuthenticated().pipe(
            take(1),
            map((isAuthenticated: boolean) => {
                if (!isAuthenticated) {
                    this.router.navigate(['/login']);
                    return false;
                }
                return true;
            })
        );
    }
}
