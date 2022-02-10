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
import { MatChipsModule, MatDividerModule, MatButtonToggleModule, MatExpansionModule, MatTooltipModule } from '@angular/material';
import { MatSelectModule } from '@angular/material/select';
import { downgradeComponent } from '@angular/upgrade/static';
import * as angular from 'angular';

import { SharedModule } from '../shared/shared.module';
import { CreateBranchModal } from './components/createBranchModal/createBranchModal.component';
import { CreateTagModal } from './components/createTagModal/createTagModal.component';
import { DownloadRecordModalComponent } from './components/downloadRecordModal/downloadRecordModal.component';
import { EditorBranchSelectComponent } from './components/editorBranchSelect/editorBranchSelect.component';
import { EditorRecordSelectComponent } from './components/editorRecordSelect/editorRecordSelect.component';
import { EditorTopBarComponent } from './components/editorTopBar/editorTopBar.component';
import { NewShapesGraphRecordModalComponent } from './components/newShapesGraphRecordModal/newShapesGraphRecordModal.component';
import { ShapesGraphEditorPageComponent } from './components/shapesGraphEditorPage/shapesGraphEditorPage.component';
import { ShapesGraphChangesPageComponent } from './components/shapesGraphChangesPage/shapesGraphChangesPage.component';
import { CommitModalComponent } from './components/commitModal/commitModal.component';
import { ShapesGraphMergePageComponent } from './components/shapesGraphMergePage/shapesGraphMergePage.component';
import { UploadRecordModalComponent } from './components/uploadRecordModal/uploadRecordModal.component';
import { ShapesGraphDetailsComponent } from './components/shapesGraphDetails/shapesGraphDetails.component';
import { StaticIriLimitedComponent } from './components/staticIriLimited/staticIriLimited.component';
import { ShapesGraphPropertiesBlockComponent } from './components/shapesGraphPropertiesBlock/shapesGraphPropertiesBlock.component';
import { ShapesGraphPropertyValuesComponent } from './components/shapesGraphPropertyValues/shapesGraphPropertyValues.component';
import { YateComponent } from './components/yate/yate.component';

/**
 * @namespace shapes-graph-editor
 *
 * The `shapes-graph-editor` module provides components that make up the Shapes Graph Editor module in the Mobi application.
 */
 @NgModule({
     imports: [
         SharedModule,
         MatDividerModule,
         MatChipsModule,
         MatSelectModule,
         MatButtonToggleModule,
         MatExpansionModule,
         MatTooltipModule
     ],
    declarations: [
        NewShapesGraphRecordModalComponent,
        ShapesGraphDetailsComponent,
        EditorBranchSelectComponent,
        EditorRecordSelectComponent,
        EditorTopBarComponent,
        ShapesGraphEditorPageComponent,
        DownloadRecordModalComponent,
        UploadRecordModalComponent,
        CommitModalComponent,
        ShapesGraphChangesPageComponent,
        ShapesGraphMergePageComponent,
        ShapesGraphPropertiesBlockComponent,
        ShapesGraphPropertyValuesComponent,
        CreateBranchModal,
        StaticIriLimitedComponent,
        YateComponent,
        CreateTagModal
    ],
    providers: [],
    entryComponents: [
        NewShapesGraphRecordModalComponent,
        ShapesGraphDetailsComponent,
        ShapesGraphEditorPageComponent,
        DownloadRecordModalComponent,
        UploadRecordModalComponent,
        CommitModalComponent,
        ShapesGraphChangesPageComponent,
        ShapesGraphMergePageComponent,
        ShapesGraphPropertiesBlockComponent,
        ShapesGraphPropertyValuesComponent,
        CreateBranchModal,
        StaticIriLimitedComponent,
        CreateTagModal,
        YateComponent
    ]
})
export class ShapesGraphEditorModule {}

angular.module('shapes-graph-editor', [])
    .directive('newShapesGraphRecordModal', downgradeComponent({component: NewShapesGraphRecordModalComponent}) as angular.IDirectiveFactory)
    .directive('shapesGraphDetailsComponent', downgradeComponent({component: ShapesGraphDetailsComponent}) as angular.IDirectiveFactory)
    .directive('uploadRecordModal', downgradeComponent({component: UploadRecordModalComponent}) as angular.IDirectiveFactory)
    .directive('downloadRecordModal', downgradeComponent({component: DownloadRecordModalComponent}) as angular.IDirectiveFactory)
    .directive('commitModal', downgradeComponent({component: CommitModalComponent}) as angular.IDirectiveFactory)
    .directive('editorBranchSelect', downgradeComponent({component: EditorBranchSelectComponent}) as angular.IDirectiveFactory)
    .directive('editorRecordSelect', downgradeComponent({component: EditorRecordSelectComponent}) as angular.IDirectiveFactory)
    .directive('editorTopBar', downgradeComponent({component: EditorTopBarComponent}) as angular.IDirectiveFactory)
    .directive('shapesGraphEditorPage', downgradeComponent({component: ShapesGraphEditorPageComponent}) as angular.IDirectiveFactory)
    .directive('shapesGraphChangesPage', downgradeComponent({component: ShapesGraphChangesPageComponent}) as angular.IDirectiveFactory)
    .directive('shapesGraphMergePage', downgradeComponent({component: ShapesGraphMergePageComponent}) as angular.IDirectiveFactory)
    .directive('staticIriLimited', downgradeComponent({component: StaticIriLimitedComponent}) as angular.IDirectiveFactory)
    .directive('shapesGraphPropertiesBlock', downgradeComponent({component: ShapesGraphPropertiesBlockComponent}) as angular.IDirectiveFactory)
    .directive('shapesGraphPropertyValues', downgradeComponent({component: ShapesGraphPropertyValuesComponent}) as angular.IDirectiveFactory)
    .directive('createBranchModal', downgradeComponent({component: CreateBranchModal}) as angular.IDirectiveFactory)
    .directive('createTagModal', downgradeComponent({component: CreateTagModal}) as angular.IDirectiveFactory)
    .directive('yate', downgradeComponent({component: YateComponent}) as angular.IDirectiveFactory);