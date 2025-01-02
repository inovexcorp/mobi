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
import { Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';

import { LoginManagerService } from '../../../shared/services/loginManager.service';

/**
 * @class login.LoginPageComponent
 *
 * `loginPage` is a component which creates the main login page of the application. The component contains a simple
 * login form for username and password and displays an error message if an error occurs.
 */
@Component({
    selector: 'login-page',
    templateUrl: './loginPage.component.html',
    styleUrls: ['./loginPage.component.scss']
})
export class LoginPageComponent {
    loginForm = this.fb.group({
        username: ['', [Validators.required]],
        password: ['', [Validators.required]]
    });
    errorMessage = '';

    constructor(private loginManagerService: LoginManagerService, private fb: UntypedFormBuilder) {}

    login(): void {
        this.loginManagerService.login(this.loginForm.controls.username.value, this.loginForm.controls.password.value)
            .subscribe(() => {
                this.errorMessage = '';
            }, errorMessage => {
                this.errorMessage = errorMessage;
            });
    }
}
