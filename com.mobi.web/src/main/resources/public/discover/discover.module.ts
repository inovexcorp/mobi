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
import { NgModule } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { QueryModule } from './query/query.module';
import { DiscoverSharedModule } from './discoverShared.module';
import { SharedModule } from '../shared/shared.module';

import { datasetFormGroupComponent } from './components/datasetFormGroup/datasetFormGroup.component';
import datasetSelectComponent from './components/datasetSelect/datasetSelect.component';
import sparqlResultTableComponent from './components/sparqlResultTable/sparqlResultTable.component';

import exploreService from './services/explore.service';

import './explore/explore.module';
import './search/search.module';

import { DiscoverPageComponent } from './components/discoverPage/discoverPage.component';

// TODO: Move to submodules once upgraded
import { ExploreTabDirective } from './explore/components/exploreTab/exploreTab.component';
import { DiscoverSearchTabDirective } from './search/components/discoverSearchTab/discoverSearchTab.component';

/**
 * @namespace discover
 *
 * The `discover` module provides components that make up the Discover module in the Mobi application.
 */
@NgModule({
    imports: [ 
        SharedModule,
        DiscoverSharedModule,
        QueryModule
    ],
    declarations: [
        DiscoverPageComponent,
        ExploreTabDirective,
        DiscoverSearchTabDirective
    ],
    entryComponents: [
        DiscoverPageComponent
    ]
})
export class DiscoverModule {}

angular.module('discover', [
        'explore',
        'query',
        'search'
    ])
    .component('datasetFormGroup', datasetFormGroupComponent)
    .component('datasetSelect', datasetSelectComponent)
    .component('sparqlResultTable', sparqlResultTableComponent)
    .service('exploreService', exploreService)
    .directive('discoverPage', downgradeComponent({component: DiscoverPageComponent}) as angular.IDirectiveFactory);
