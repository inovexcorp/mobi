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
import { NgModule } from '@angular/core';
import { downgradeComponent, downgradeInjectable } from '@angular/upgrade/static';
import * as angular from 'angular';

import { SharedModule } from '../../shared/shared.module';
import { DiscoverSharedModule } from '../discoverShared.module';

import { ExploreUtilsService } from './services/exploreUtils.service';
import { ClassCardsComponent } from './components/classCards/classCards.component';
import { ClassesDisplayComponent } from './components/classesDisplay/classesDisplay.component';
import { ExploreTabComponent } from './components/exploreTab/exploreTab.component';
import { InstanceCardsComponent } from './components/instanceCards/instanceCards.component';
import { InstancesDisplayComponent } from './components/instancesDisplay/instancesDisplay.component';
import { NewInstanceClassOverlayComponent } from './components/newInstanceClassOverlay/newInstanceClassOverlay.component';
import { ClassBlockHeaderComponent } from './components/classBlockHeader/classBlockHeader.component';
import { InstanceViewComponent } from './components/instanceView/instanceView.component';
import { InstanceEditorComponent } from './components/instanceEditor/instanceEditor.component';
import { InstanceFormComponent } from './components/instanceForm/instanceForm.component';
import { InstanceCreatorComponent } from './components/instanceCreator/instanceCreator.component';
import { NewInstancePropertyOverlayComponent } from './components/newInstancePropertyOverlay/newInstancePropertyOverlay.component';

/**
 * @namespace explore
 *
 * The `explore` module provides components that make up the Explore submodule in the Mobi application.
 */
@NgModule({
    imports: [
        SharedModule,
        DiscoverSharedModule
    ],
    declarations: [
        ClassCardsComponent,
        ClassesDisplayComponent,
        ExploreTabComponent,
        InstanceCardsComponent,
        InstancesDisplayComponent,
        NewInstanceClassOverlayComponent,
        ClassBlockHeaderComponent,
        InstanceViewComponent,
        InstanceEditorComponent,
        InstanceFormComponent,
        InstanceCreatorComponent,
        NewInstancePropertyOverlayComponent,
    ],
    providers: [
        ExploreUtilsService
    ],
    entryComponents: [
        ExploreTabComponent,
        NewInstanceClassOverlayComponent,
        NewInstancePropertyOverlayComponent,
    ],
    exports: [
        ExploreTabComponent
    ]
})
export class ExploreModule {}

angular.module('explore', [])
    .factory('exploreUtilsService', downgradeInjectable(ExploreUtilsService))
    .directive('classCards', downgradeComponent({component: ClassCardsComponent}) as angular.IDirectiveFactory)
    .directive('classBlock', downgradeComponent({component: ClassesDisplayComponent}) as angular.IDirectiveFactory)
    .directive('exploreTab', downgradeComponent({component: ExploreTabComponent}) as angular.IDirectiveFactory)
    .directive('instanceCards', downgradeComponent({component: InstanceCardsComponent}) as angular.IDirectiveFactory)
    .directive('instancesDisplay', downgradeComponent({component: InstancesDisplayComponent}) as angular.IDirectiveFactory)
    .directive('newInstanceClassOverlay', downgradeComponent({component: NewInstanceClassOverlayComponent}) as angular.IDirectiveFactory)
    .directive('classBlockHeader', downgradeComponent({component: ClassBlockHeaderComponent}) as angular.IDirectiveFactory)
    .directive('instanceView', downgradeComponent({component: InstanceViewComponent}) as angular.IDirectiveFactory)
    .directive('instanceEditor', downgradeComponent({component: InstanceEditorComponent}) as angular.IDirectiveFactory)
    .directive('instanceForm', downgradeComponent({component: InstanceFormComponent}) as angular.IDirectiveFactory)
    .directive('instanceCreatorComponent', downgradeComponent({component: InstanceCreatorComponent}) as angular.IDirectiveFactory)
    .directive('newInstancePropertyOverlay', downgradeComponent({component: NewInstancePropertyOverlayComponent}) as angular.IDirectiveFactory)
