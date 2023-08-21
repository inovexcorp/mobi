/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { OntologyVisualization } from './components/ontologyVisualization/ontologyVisualization.component';
import { VisualizationSidebar } from './components/visualizationSidebar/visualizationSidebar.component';
import { VisualizationClassListComponent } from './components/visualizationClassList/visualizationClassList.component';
import { VisualizationSidebarSearch } from './components/visualizationSidebarSearch/visualizationSidebarSearch.component';
import { OntologyVisualizationService } from './services/ontologyVisualization.service';
import { OntologyVisualizationDataService } from './services/ontologyVisualizationData.service';
import { D3SimulatorService } from './services/d3Simulator.service';
import { ControlRecordUtilsService } from './services/controlRecordUtils.service';

/**
 * @namespace ontology-visualization
 *
 * The `ontology-visualization` module provides the components and services required for visualizing an ontology
 * using an interactable "ball and stick" diagram.
 */
@NgModule({
    imports: [
        BrowserModule,
        SharedModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatListModule,
    ],
    declarations: [
        OntologyVisualization,
        VisualizationSidebar,
        VisualizationSidebarSearch,
        VisualizationClassListComponent,
    ],
    exports: [
        MatExpansionModule,
        VisualizationSidebar,
        OntologyVisualization
    ],
    providers: [
        ControlRecordUtilsService,
        D3SimulatorService,
        OntologyVisualizationService,
        OntologyVisualizationDataService,
    ]
})
export class OntologyVisualizationModule {}
