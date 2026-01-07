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
import { MatDialog } from '@angular/material/dialog';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { SelectedDetailsComponent } from '../../../shared/components/selectedDetails/selectedDetails.component';
import { AnnotationBlockComponent } from '../annotationBlock/annotationBlock.component';
import { UsagesBlockComponent } from '../usagesBlock/usagesBlock.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { ConceptHierarchyBlockComponent } from '../conceptHierarchyBlock/conceptHierarchyBlock.component';
import { DatatypePropertyBlockComponent } from '../datatypePropertyBlock/datatypePropertyBlock.component';
import { ObjectPropertyBlockComponent } from '../objectPropertyBlock/objectPropertyBlock.component';
import { SKOS } from '../../../prefixes';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { ConceptsTabComponent } from './conceptsTab.component';

describe('Concepts Tab components', function() {
    let component: ConceptsTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ConceptsTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let dialogStub : jasmine.SpyObj<MatDialog>;
    let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ConceptsTabComponent,
                MockComponent(ConceptHierarchyBlockComponent),
                MockComponent(SelectedDetailsComponent),
                MockComponent(AnnotationBlockComponent),
                MockComponent(DatatypePropertyBlockComponent),
                MockComponent(ObjectPropertyBlockComponent),
                MockComponent(UsagesBlockComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(PropertyManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ConceptsTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        dialogStub = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {
            '@id': 'axiom1',
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2', '@type': 'type', '@language': 'language'}]
        };
        propertyManagerStub.conceptSchemeRelationshipList = [`${SKOS}topConceptOf`, `${SKOS}inScheme`];
        ontologyStateStub.listItem.iriList = [`${SKOS}topConceptOf`, `${SKOS}inScheme`];
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        ontologyStateStub = null;
        dialogStub = null;
    });

    it('initializes correctly', function() {
        expect(component.relationshipList).toEqual([`${SKOS}topConceptOf`, `${SKOS}inScheme`]);
        expect(ontologyStateStub.listItem.editorTabStates.concepts.element).toEqual(component.conceptsTab);
    });
    it('should tear down correctly', function() {
        ontologyStateStub.listItem.editorTabStates.concepts.element = component.conceptsTab;
        component.ngOnDestroy();
        expect(ontologyStateStub.listItem.editorTabStates.concepts.element).toBeUndefined();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.concepts-tab.row')).length).toEqual(1);
        });
        ['concept-hierarchy-block', 'selected-details', 'annotation-block', 'object-property-block', 'usages-block', 'datatype-property-block'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with a button to delete a concept if the user can modify', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const button = element.queryAll(By.css('.selected-header button[color="warn"]'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toContain('Delete');
        });
        it('with no button to delete a concept if the user cannot modify', function() {
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-header button[color="warn"]')).length).toEqual(0);
        });
        it('with a button to see the concept history', function() {
            const button = element.queryAll(By.css('.selected-header button[color="primary"]'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toEqual('See History');
        });
        it('depending on whether something is selected', function() {
            expect(element.queryAll(By.css('.selected-concept div')).length).toBeGreaterThan(0);

            ontologyStateStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-concept div')).length).toEqual(0);
        });
        it('depending on whether the selected concept is imported', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const historyButton = element.queryAll(By.css('.selected-header button[color="primary"]'))[0];
            const deleteButton = element.queryAll(By.css('.selected-header button[color="warn"]'))[0];
            expect(historyButton.properties['disabled']).toBeFalsy();
            expect(deleteButton.properties['disabled']).toBeFalsy();

            ontologyStateStub.isSelectedImported.and.returnValue(true);
            fixture.detectChanges();
            expect(historyButton.properties['disabled']).toBeTruthy();
            expect(deleteButton.properties['disabled']).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should show a delete confirmation modal', function() {
            component.showDeleteConfirmation();
            expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                data: {
                    content: '<p>Are you sure that you want to delete <strong>axiom1</strong>?</p>'}});
        });
        it('should show a class history', function() {
            component.seeHistory();
            expect(ontologyStateStub.listItem.seeHistory).toEqual(true);
        });
    });
    it('should set seeHistory to true when the see history button is clicked', function() {
        spyOn(component, 'seeHistory');
        const button = element.queryAll(By.css('.selected-header button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.seeHistory).toHaveBeenCalledWith();
    });
    it('should call showDeleteConfirmation when the delete button is clicked', function() {
        ontologyStateStub.canModify.and.returnValue(true);
        fixture.detectChanges();
        spyOn(component, 'showDeleteConfirmation');
        const button = element.queryAll(By.css('.selected-header button[color="warn"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.showDeleteConfirmation).toHaveBeenCalledWith();
    });
});
