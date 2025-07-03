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

import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ImportsBlockComponent } from '../../../shared/components/importsBlock/importsBlock.component';
import { PropertiesBlockComponent } from '../../../shared/components/propertiesBlock/propertiesBlock.component';
import { PreviewBlockComponent } from '../previewBlock/previewBlock.component';
import { SelectedDetailsComponent } from '../../../shared/components/selectedDetails/selectedDetails.component';
import { ProjectTabComponent } from './projectTab.component';

describe('Project Tab component', function() {
    let component: ProjectTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ProjectTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ProjectTabComponent,
                MockComponent(SelectedDetailsComponent),
                MockComponent(PropertiesBlockComponent),
                MockComponent(PreviewBlockComponent),
                MockComponent(ImportsBlockComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
            ]
        }).compileComponents();

        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
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
        expect(ontologyStateStub.listItem.editorTabStates.project.element).toEqual(component.projectTab);
    });
    it('should tear down correctly', function() {
        ontologyStateStub.listItem.editorTabStates.project.element = component.projectTab;
        component.ngOnDestroy();
        expect(ontologyStateStub.listItem.editorTabStates.project.element).toBeUndefined();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.project-tab')).length).toEqual(1);
        });
        it('depending on whether something is selected', function() {
            const components = ['selected-details', 'properties-block', 'imports-block', 'preview-block'];
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
