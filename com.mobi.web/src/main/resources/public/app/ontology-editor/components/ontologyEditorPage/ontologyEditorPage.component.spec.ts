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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyTabComponent } from '../ontologyTab/ontologyTab.component';
import { EditorTopBarComponent } from '../../../versioned-rdf-record-editor/components/editor-top-bar/editor-top-bar.component';
import { ChangesPageComponent } from '../../../versioned-rdf-record-editor/components/changes-page/changes-page.component';
import { MergePageComponent } from '../../../versioned-rdf-record-editor/components/merge-page/merge-page.component';
import { OntologyEditorPageComponent } from './ontologyEditorPage.component';

describe('Ontology Editor Page component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyEditorPageComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                OntologyEditorPageComponent,
                MockComponent(EditorTopBarComponent),
                MockComponent(ChangesPageComponent),
                MockComponent(MergePageComponent),
                MockComponent(OntologyTabComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyEditorPageComponent);
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyStateStub.toast = jasmine.createSpyObj('toast',['get'], {
            clearToast: jasmine.createSpy('clearToast').and.callThrough(),
        });
        ontologyStateStub.snackBar = jasmine.createSpyObj('snackBar',['get'], {
            dismiss: jasmine.createSpy('dismiss').and.callThrough(),
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.ontology-editor-page')).length).toEqual(1);
        });
        it('depending on whether an ontology is selected', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('ontology-tab')).length).toEqual(0);

            ontologyStateStub.listItem = new OntologyListItem();
            fixture.detectChanges();
            expect(element.queryAll(By.css('ontology-tab')).length).toEqual(1);
        });
        it('depending on whether a merge is in progress', function() {
          ontologyStateStub.listItem = new OntologyListItem();
          fixture.detectChanges();
          expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(1);
          expect(element.queryAll(By.css('app-merge-page')).length).toEqual(0);
          expect(element.queryAll(By.css('ontology-tab')).length).toEqual(1);

          ontologyStateStub.listItem.merge.active = true;
          fixture.detectChanges();
          expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(0);
          expect(element.queryAll(By.css('app-merge-page')).length).toEqual(1);
          expect(element.queryAll(By.css('ontology-tab')).length).toEqual(0);
        });
        it('depending on whether the changes page is open', function() {
          ontologyStateStub.listItem = new OntologyListItem();
          fixture.detectChanges();
          expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(1);
          expect(element.queryAll(By.css('ontology-tab')).length).toEqual(1);
          expect(element.queryAll(By.css('app-changes-page')).length).toEqual(0);

          ontologyStateStub.listItem.changesPageOpen = true;
          fixture.detectChanges();
          expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(1);
          expect(element.queryAll(By.css('ontology-tab')).length).toEqual(0);
          expect(element.queryAll(By.css('app-changes-page')).length).toEqual(1);
        });
    });
});
