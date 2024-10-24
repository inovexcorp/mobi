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
import { CanActivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { LoginManagerService } from './shared/services/loginManager.service';

/**
 * AuthenticationGuard is a route guard that protects routes from unauthorized access
 * by checking the user's authentication status. If the user is not authenticated,
 * they are redirected to the login page.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(private loginManagerService: LoginManagerService) {}
    /**
     * Checks to see if Authentication token is valid.
     * 
     * Checks: 
     * - If mobi_web_token cookie exist
     * - If mobi_web_token JWT token is expired
     * - If session is valid
     * 
     * @returns Observable<boolean> Returns true if Authentication token is valid, false if it is not valid
     */
    canActivate(): Observable<boolean> {
        return this.loginManagerService.validateSession();
    }
}