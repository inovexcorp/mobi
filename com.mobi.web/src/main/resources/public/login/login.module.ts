/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import * as angular from 'angular';
import { NgModule } from '@angular/core';

import { downgradeComponent } from '@angular/upgrade/static';

import { SharedModule } from '../shared/shared.module';

import { LoginPageComponent } from './components/loginPage/loginPage.component';

/**
 * @namespace login
 *
 * The `login` module provides components that make up the login page of Mobi.
 */
@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        LoginPageComponent
    ],
    entryComponents: [
        LoginPageComponent
    ]
})
export class LoginModule {}

angular.module('login', [])
    .directive('loginPage', downgradeComponent({component: LoginPageComponent}) as angular.IDirectiveFactory);
