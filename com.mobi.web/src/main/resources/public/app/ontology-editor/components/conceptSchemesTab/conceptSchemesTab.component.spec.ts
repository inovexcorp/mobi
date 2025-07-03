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
import { MatDialog } from '@angular/material/dialog';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { SelectedDetailsComponent } from '../../../shared/components/selectedDetails/selectedDetails.component';
import { AnnotationBlockComponent } from '../annotationBlock/annotationBlock.component';
import { UsagesBlockComponent } from '../usagesBlock/usagesBlock.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { SharedModule } from '../../../shared/shared.module';
import {
    ConceptSchemeHierarchyBlockComponent
} from '../conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.component';
import { DatatypePropertyBlockComponent } from '../datatypePropertyBlock/datatypePropertyBlock.component';
import { ObjectPropertyBlockComponent } from '../objectPropertyBlock/objectPropertyBlock.component';
import { SKOS } from '../../../prefixes';
import { ConceptSchemesTabComponent } from './conceptSchemesTab.component';

describe('Concept Schemes Tab component', function() {
    let component: ConceptSchemesTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ConceptSchemesTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let dialogStub : jasmine.SpyObj<MatDialog>;

      beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ConceptSchemesTabComponent,
                MockComponent(ConceptSchemeHierarchyBlockComponent),
                MockComponent(SelectedDetailsComponent),
                MockComponent(AnnotationBlockComponent),
                MockComponent(DatatypePropertyBlockComponent),
                MockComponent(ObjectPropertyBlockComponent),
                MockComponent(UsagesBlockComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    }) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ConceptSchemesTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        dialogStub = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {
            '@id': 'schemeId',
            '@type': [`${SKOS}ConceptScheme`]
        };
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
        dialogStub = null;
    });

    it('should initialize correctly', function() {
        component.ngOnInit();
        expect(ontologyStateStub.listItem.editorTabStates.schemes.element).toEqual(component.conceptSchemesTab);
    });
    it('should tear down correctly', function() {
        ontologyStateStub.listItem.editorTabStates.schemes.element = component.conceptSchemesTab;
        component.ngOnDestroy();
        expect(ontologyStateStub.listItem.editorTabStates.schemes.element).toBeUndefined();
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.concept-schemes-tab.row')).length).toEqual(1);
        });
        ['concept-scheme-hierarchy-block', 'selected-details', 'annotation-block', 'object-property-block', 'usages-block'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with a data-property-block depending on whether the selected entity is a concept', function() {
            ontologyManagerStub.isConcept.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('datatype-property-block')).length).toEqual(0);

            ontologyManagerStub.isConcept.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('datatype-property-block')).length).toEqual(1);
        });
        it('with a button to delete a concept scheme if a user can modify', function() {
            ontologyStateStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const button = element.queryAll(By.css('.selected-header button[color="warn"]'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toContain('Delete');
        });
        it('with no button to delete a concept scheme if a user cannot modify', function() {
            ontologyStateStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-header button[color="warn"]')).length).toEqual(0);
        });
        it('with a button to see the entity history', function() {
            const button = element.queryAll(By.css('.selected-header button[color="primary"]'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toEqual('See History');
        });
        it('based on whether something is selected', function() {
            expect(element.queryAll(By.css('.selected-entity div')).length).toBeGreaterThan(0);

            ontologyStateStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-entity div')).length).toEqual(0);
        });
        it('depending on whether the selected entity is imported', function() {
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
        it('should open a delete confirmation modal', function() {
            component.showDeleteConfirmation();
            expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                data: {
                    content: '<p>Are you sure that you want to delete <strong>schemeId</strong>?</p>'}});
        });
        it('should show a class history', function() {
            component.seeHistory();
            expect(ontologyStateStub.listItem.seeHistory).toEqual(true);
        });
        it('if it is a concept', function() {
            ontologyManagerStub.isConcept.and.returnValue(true);
            ontologyManagerStub.isConceptScheme.and.returnValue(false);
            component.deleteEntity();
            expect(ontologyManagerStub.isConcept).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, ontologyStateStub.listItem.derivedConcepts);
            expect(ontologyStateStub.deleteConcept).toHaveBeenCalledWith();
            expect(ontologyStateStub.deleteConceptScheme).not.toHaveBeenCalled();
        });
        it('if it is a concept scheme', function() {
            ontologyManagerStub.isConcept.and.returnValue(false);
            ontologyManagerStub.isConceptScheme.and.returnValue(true);
            component.deleteEntity();
            expect(ontologyManagerStub.isConceptScheme).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, ontologyStateStub.listItem.derivedConceptSchemes);
            expect(ontologyStateStub.deleteConcept).not.toHaveBeenCalled();
            expect(ontologyStateStub.deleteConceptScheme).toHaveBeenCalledWith();
        });
    });
    it('should call seeHistory when the see history button is clicked', function() {
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
