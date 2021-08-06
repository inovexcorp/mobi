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
import { downgradeComponent } from '@angular/upgrade/static';
import { NgModule } from '@angular/core';

import { ActivityCardComponent } from './components/activityCard/activityCard.component';
import { ActivityTitleComponent } from './components/activityTitle/activityTitle.component';
import { HomePageComponent } from './components/homePage/homePage.component';
import { QuickActionGridComponent } from './components/quickActionGrid/quickActionGrid.component';
import { SharedModule } from '../shared/shared.module';

/**
 * @namspace home
 *
 * The `home` module provides components that make up the Home module in the Mobi application.
 */
@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        ActivityCardComponent,
        ActivityTitleComponent,
        HomePageComponent,
        QuickActionGridComponent
    ],
    providers: [
        {provide: '$state', useFactory: ($injector: any) => $injector.get('$state'), deps: ['$injector']}
    ],
    entryComponents: [
        ActivityCardComponent,
        ActivityTitleComponent,
        HomePageComponent,
        QuickActionGridComponent
    ]
})
export class HomeModule {}

angular.module('home', [])
    .directive('activityCard', downgradeComponent({component: ActivityCardComponent}) as angular.IDirectiveFactory)
    .directive('activityTitle', downgradeComponent({component: ActivityTitleComponent}) as angular.IDirectiveFactory)
    .directive('homePage', downgradeComponent({component: HomePageComponent}) as angular.IDirectiveFactory)
    .directive('quickActionGrid', downgradeComponent({component: QuickActionGridComponent}) as angular.IDirectiveFactory);
