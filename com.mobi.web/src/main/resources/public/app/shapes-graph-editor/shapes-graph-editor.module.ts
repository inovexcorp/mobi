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
import { NgModule } from '@angular/core';

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
        SharedModule
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
    providers: []
})
export class ShapesGraphEditorModule {}
