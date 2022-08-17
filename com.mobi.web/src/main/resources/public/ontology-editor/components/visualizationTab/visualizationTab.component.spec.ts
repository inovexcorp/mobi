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
import { DebugElement } from '@angular/core';
import { configureTestSuite } from 'ng-bullet';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    OntologyVisualization
} from '../../../ontology-visualization/components/visualization/ontologyVisualization.component';
import { MockComponent, MockProvider } from "ng-mocks";
import { VisualizationTabComponent } from "./visualizationTab.component";
import {
    VisualizationSidebar
} from '../../../ontology-visualization/components/visualizationSidebar/visualizationSidebar.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';


describe('Visualization Tab component', function() {
    let component: VisualizationTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<VisualizationTabComponent>;

    configureTestSuite(() =>  {
        TestBed.configureTestingModule({
            declarations: [
                MockComponent(OntologyVisualization),
                VisualizationTabComponent,
                MockComponent(VisualizationSidebar)
            ],
            providers: [
                MockProvider(OntologyStateService)
            ]
        });
    });
    beforeEach(function() {
        fixture = TestBed.createComponent(VisualizationTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.nativeElement.querySelectorAll('.visualization-tab').length).toEqual(1);
        });
    });
});
