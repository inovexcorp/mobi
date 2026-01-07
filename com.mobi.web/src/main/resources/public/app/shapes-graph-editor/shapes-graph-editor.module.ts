/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
//angular imports
import { NgModule } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

//Mobi & Local imports
import { SharedModule } from '../shared/shared.module';
import { VersionedRdfRecordEditorModule } from '../versioned-rdf-record-editor/versioned-rdf-record-editor.module';

import { AddPathNodeHoverButtonComponent } from './components/add-path-node-hover-button/add-path-node-hover-button.component';
import { AddPathNodeModalComponent } from './components/add-path-node-modal/add-path-node-modal.component';
import { AddPropertyShapeModalComponent } from './components/add-property-shape-modal/add-property-shape-modal.component';
import { ConstraintTypeFormComponent } from './components/constraint-type-form/constraint-type-form.component';
import { CreateNodeShapeModalComponent } from './components/create-node-shape-modal/create-node-shape-modal.component';
import { NodeShapesDisplayComponent } from './components/node-shapes-display/node-shapes-display.component';
import { NodeShapesItemComponent } from './components/node-shapes-item/node-shapes-item.component';
import { NodeShapesListComponent } from './components/node-shapes-list/node-shapes-list.component';
import { NodeShapesTabComponent } from './components/node-shapes-tab/node-shapes-tab.component';
import { PathNodeDisplayComponent } from './components/path-node-display/path-node-display.component';
import { PropertyShapePathComponent } from './components/property-shape-path/property-shape-path.component';
import { PropertyShapesDisplayComponent } from './components/property-shapes-display/property-shapes-display.component';
import { ShaclChipSuggestionsInputComponent } from './components/shacl-chip-suggestions-input/shacl-chip-suggestions-input.component';
import { ShaclSingleSuggestionInputComponent } from './components/shacl-single-suggestion-input/shacl-single-suggestion-input.component';
import { ShaclTargetComponent } from './components/shacl-target/shacl-target.component';
import { ShaclTargetNodeInputComponent } from './components/shacl-target-node-input/shacl-target-node-input.component';
import { ShaclTargetSelectorComponent } from './components/shacl-target-selector/shacl-target-selector.component';
import { ShapeButtonStackComponent } from './components/shape-button-stack/shape-button-stack.component';
import { ShapesGraphEditorPageComponent } from './components/shapesGraphEditorPage/shapesGraphEditorPage.component';
import { ShapesPreviewComponent } from './components/shapes-preview/shapes-preview.component';
import { ShapesProjectTabComponent } from './components/shapes-project-tab/shapes-project-tab.component';
import { ShapesTabsHolderComponent } from './components/shapes-tabs-holder/shapes-tabs-holder.component';

/**
 * @namespace shapes-graph-editor
 *
 * The `shapes-graph-editor` module provides components that make up the Shapes Graph Editor module in the Mobi application.
 */
 @NgModule({
   imports: [
     SharedModule,
     VersionedRdfRecordEditorModule,
     ScrollingModule
   ],
   declarations: [
     AddPathNodeHoverButtonComponent,
     AddPathNodeModalComponent,
     AddPropertyShapeModalComponent,
     ConstraintTypeFormComponent,
     CreateNodeShapeModalComponent,
     NodeShapesDisplayComponent,
     NodeShapesItemComponent,
     NodeShapesListComponent,
     NodeShapesTabComponent,
     PathNodeDisplayComponent,
     PropertyShapePathComponent,
     PropertyShapesDisplayComponent,
     PropertyShapesDisplayComponent,
     ShaclChipSuggestionsInputComponent,
     ShaclSingleSuggestionInputComponent,
     ShaclTargetComponent,
     ShaclTargetNodeInputComponent,
     ShaclTargetNodeInputComponent,
     ShaclTargetSelectorComponent,
     ShapeButtonStackComponent,
     ShapesGraphEditorPageComponent,
     ShapesPreviewComponent,
     ShapesProjectTabComponent,
     ShapesTabsHolderComponent
   ],
   providers: []
})
export class ShapesGraphEditorModule { }
