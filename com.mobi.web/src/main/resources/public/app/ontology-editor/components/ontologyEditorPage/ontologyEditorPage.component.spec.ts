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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologySidebarComponent } from '../ontologySidebar/ontologySidebar.component';
import { OntologyTabComponent } from '../ontologyTab/ontologyTab.component';
import { OpenOntologyTabComponent } from '../openOntologyTab/openOntologyTab.component';
import { OntologyEditorPageComponent } from './ontologyEditorPage.component';

describe('Ontology Editor Page component', function() {
    let component: OntologyEditorPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyEditorPageComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                OntologyEditorPageComponent,
                MockComponent(OpenOntologyTabComponent),
                MockComponent(OntologySidebarComponent),
                MockComponent(OntologyTabComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyEditorPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.ontology-editor-page')).length).toEqual(1);
        });
        it('with a ontology-sidebar', function() {
            expect(element.queryAll(By.css('ontology-sidebar')).length).toEqual(1);
        });
        it('depending on whether an ontology is selected', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('open-ontology-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('ontology-tab')).length).toEqual(0);

            ontologyStateStub.listItem = new OntologyListItem();
            fixture.detectChanges();
            expect(element.queryAll(By.css('open-ontology-tab')).length).toEqual(0);
            expect(element.queryAll(By.css('ontology-tab')).length).toEqual(1);
        });
    });
});
