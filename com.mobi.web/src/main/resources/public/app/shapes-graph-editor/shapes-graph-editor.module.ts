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
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { ShapesGraphDetailsComponent } from './components/shapesGraphDetails/shapesGraphDetails.component';
import { ShapesGraphEditorPageComponent } from './components/shapesGraphEditorPage/shapesGraphEditorPage.component';
import { ShapesGraphPropertiesBlockComponent } from './components/shapesGraphPropertiesBlock/shapesGraphPropertiesBlock.component';
import { ShapesGraphPropertyValuesComponent } from './components/shapesGraphPropertyValues/shapesGraphPropertyValues.component';
import { ShapesPreviewComponent } from './components/shapes-preview/shapes-preview.component';
import { ShapesTabsHolderComponent } from './components/shapes-tabs-holder/shapes-tabs-holder.component';
import { ShapesProjectTabComponent } from './components/shapes-project-tab/shapes-project-tab.component';
import { StaticIriLimitedComponent } from './components/staticIriLimited/staticIriLimited.component';
import { VersionedRdfRecordEditorModule } from '../versioned-rdf-record-editor/versioned-rdf-record-editor.module';

/**
 * @namespace shapes-graph-editor
 *
 * The `shapes-graph-editor` module provides components that make up the Shapes Graph Editor module in the Mobi application.
 */
 @NgModule({
     imports: [
        SharedModule,
        VersionedRdfRecordEditorModule,
     ],
    declarations: [
        ShapesGraphDetailsComponent,
        ShapesGraphEditorPageComponent,
        ShapesGraphPropertiesBlockComponent,
        ShapesGraphPropertyValuesComponent,
        StaticIriLimitedComponent,
        ShapesPreviewComponent,
        ShapesTabsHolderComponent,
        ShapesProjectTabComponent,
    ],
    providers: []
})
export class ShapesGraphEditorModule {}
