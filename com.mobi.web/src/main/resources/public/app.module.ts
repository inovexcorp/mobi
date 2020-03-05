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
import {ErrorHandler, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { HttpModule } from '@angular/http';

import { MODULE_NAME } from './app.module.ajs';

import { SharedModule } from './shared/shared.module';
import { LoginModule } from './login/login.module';
import {HomeModule} from "./home/home.module";

@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        HttpModule,
        SharedModule,
        LoginModule,
        HomeModule
    ],
    declarations: [],
    entryComponents: [],
    providers: []
})
export class AppModule /*implements ErrorHandler*/ {
    constructor(private upgrade: UpgradeModule) {

    }
    // handleError(error) {
    //     // exception occured in some service class method.
    //     console.log('Error in MyErrorhandler - %s', error);
    //     if(error == 'Something went wrong'){
    //         //do this.
    //     }else{
    //         //do this thing.
    //     }
    // }

    ngDoBootstrap() {
        this.upgrade.bootstrap(document.documentElement, [MODULE_NAME], { strictDi: true });
    }
}