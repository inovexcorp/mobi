/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { MatChipsModule, MatDividerModule } from '@angular/material';
import { MatSelectModule } from '@angular/material/select';
import { downgradeComponent } from '@angular/upgrade/static';
import * as angular from 'angular';

import { SharedModule } from '../shared/shared.module';
import { DownloadRecordModalComponent } from './components/downloadRecordModal/downloadRecordModal.component';
import { EditorBranchSelectComponent } from './components/editorBranchSelect/editorBranchSelect.component';
import { EditorRecordSelectComponent } from './components/editorRecordSelect/editorRecordSelect.component';
import { EditorTopBarComponent } from './components/editorTopBar/editorTopBar.component';
import { NewShapesGraphRecordModalComponent } from './components/newShapesGraphRecordModal/newShapesGraphRecordModal.component';
import { ShapesGraphEditorPageComponent } from './components/shapesGraphEditorPage/shapesGraphEditorPage.component';

/**
 * @namspace shapes-graph-editor
 *
 * The `shapes-graph-editor` module provides components that make up the Shapes Graph Editor module in the Mobi application.
 */
 @NgModule({
     imports: [
         SharedModule,
         MatDividerModule,
         MatChipsModule,
         MatSelectModule
     ],
    declarations: [
        NewShapesGraphRecordModalComponent,
        EditorBranchSelectComponent,
        EditorRecordSelectComponent,
        EditorTopBarComponent,
        ShapesGraphEditorPageComponent,
        DownloadRecordModalComponent
    ],
    providers: [],
    entryComponents: [
        NewShapesGraphRecordModalComponent,
        ShapesGraphEditorPageComponent,
        DownloadRecordModalComponent
    ]
})
export class ShapesGraphEditorModule {}

angular.module('shapes-graph-editor', [])
    .directive('newShapesGraphRecordModal', downgradeComponent({component: NewShapesGraphRecordModalComponent}) as angular.IDirectiveFactory)
    .directive('downloadRecordModal', downgradeComponent({component: DownloadRecordModalComponent}) as angular.IDirectiveFactory)
    .directive('editorBranchSelect', downgradeComponent({component: EditorBranchSelectComponent}) as angular.IDirectiveFactory)
    .directive('editorRecordSelect', downgradeComponent({component: EditorRecordSelectComponent}) as angular.IDirectiveFactory)
    .directive('editorTopBar', downgradeComponent({component: EditorTopBarComponent}) as angular.IDirectiveFactory)
    .directive('shapesGraphEditorPage', downgradeComponent({component: ShapesGraphEditorPageComponent}) as angular.IDirectiveFactory)
