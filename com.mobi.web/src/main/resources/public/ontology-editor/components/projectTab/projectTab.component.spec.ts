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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ImportsBlockComponent } from '../importsBlock/importsBlock.component';
import { OntologyPropertiesBlockComponent } from '../ontologyPropertiesBlock/ontologyPropertiesBlock.component';
import { PreviewBlockComponent } from '../previewBlock/previewBlock.component';
import { SelectedDetailsComponent } from '../selectedDetails/selectedDetails.component';
import { ProjectTabComponent } from './projectTab.component';

describe('Project Tab component', function() {
    let component: ProjectTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ProjectTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                ProjectTabComponent,
                MockComponent(SelectedDetailsComponent),
                MockComponent(OntologyPropertiesBlockComponent),
                MockComponent(PreviewBlockComponent),
                MockComponent(ImportsBlockComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyStateStub.listItem = new OntologyListItem();
        
        fixture = TestBed.createComponent(ProjectTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    it('should initialize correctly', function() {
        component.ngOnInit();
        expect(ontologyStateStub.listItem.editorTabStates.project.component).toEqual(component.projectTab);
    });
    it('should tear down correctly', function() {
        ontologyStateStub.listItem.editorTabStates.project.component = component.projectTab;
        component.ngOnDestroy();
        expect(ontologyStateStub.listItem.editorTabStates.project.component).toBeUndefined();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.project-tab')).length).toEqual(1);
        });
        it('depending on whether something is selected', function() {
            const components = ['selected-details', 'ontology-properties-block', 'imports-block', 'preview-block'];
            fixture.detectChanges();
            components.forEach(test => {
                expect(element.queryAll(By.css(test)).length).toEqual(0);
            });

            ontologyStateStub.listItem.selected = {'@id': 'iri'};
            fixture.detectChanges();
            components.forEach(test => {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
