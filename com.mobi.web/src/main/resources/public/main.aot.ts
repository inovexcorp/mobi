/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import 'reflect-metadata';
import { enableProdMode, NgZone } from '@angular/core';
import { setAngularJSGlobal } from '@angular/upgrade/static';
import { platformBrowser } from '@angular/platform-browser';
import { UIRouter, UrlService } from '@uirouter/core';
import 'zone.js';

import { AppModuleNgFactory } from './app.module.ngfactory';

setAngularJSGlobal(angular);
enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory)
    .then(platformRef => {
        // get() the UIRouter instance from DI to initialize the router
        const urlService: UrlService = platformRef.injector.get(UIRouter).urlService;

        // Instruct UIRouter to listen to URL changes
        const startUIRouter = () => {
            urlService.listen();
            urlService.sync();
        };
        
        platformRef.injector.get<NgZone>(NgZone).run(startUIRouter);
    });
