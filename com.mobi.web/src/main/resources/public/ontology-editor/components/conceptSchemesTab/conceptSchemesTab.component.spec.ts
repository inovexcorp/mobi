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
import { MatDialog } from '@angular/material';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { SelectedDetailsComponent } from '../selectedDetails/selectedDetails.component';
import { AnnotationBlockComponent } from '../annotationBlock/annotationBlock.component';
import { UsagesBlockComponent } from '../usagesBlock/usagesBlock.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { ConceptSchemesTabComponent } from './conceptSchemesTab.component';
import {
    ConceptSchemeHierarchyBlockComponent
} from '../conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.component';
import { DatatypePropertyBlockComponent } from '../datatypePropertyBlock/datatypePropertyBlock.component';
import { ObjectPropertyBlockComponent } from '../objectPropertyBlock/objectPropertyBlock.component';
import {SKOS} from '../../../prefixes';

describe('Concept Schemes Tab component', function() {
    let component: ConceptSchemesTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ConceptSchemesTabComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerServiceStub: jasmine.SpyObj<OntologyManagerService>;
    let dialogStub : jasmine.SpyObj<MatDialog>;

    configureTestSuite(function() {
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
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ConceptSchemesTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.get(OntologyStateService);
        ontologyManagerServiceStub = TestBed.get(OntologyManagerService);
        dialogStub = TestBed.get(MatDialog);

        ontologyStateServiceStub.listItem = new OntologyListItem();
        ontologyStateServiceStub.listItem.selected = {
            '@id': 'schemeId',
            '@type': [SKOS + 'ConceptScheme']
        };
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        ontologyStateServiceStub = null;
        ontologyManagerServiceStub = null;
        dialogStub = null;
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
            ontologyManagerServiceStub.isConcept.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('datatype-property-block')).length).toEqual(0);

            ontologyManagerServiceStub.isConcept.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('datatype-property-block')).length).toEqual(1);
        })
        it('with a button to delete a concept scheme if a user can modify', function() {
            ontologyStateServiceStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const button = element.queryAll(By.css('.selected-header button.btn-danger'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toContain('Delete');
        });
        it('with no button to delete a concept scheme if a user cannot modify', function() {
            ontologyStateServiceStub.canModify.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-header button.btn-danger')).length).toEqual(0);
        });
        it('with a button to see the entity history', function() {
            const button = element.queryAll(By.css('.selected-header button.btn-primary'));
            expect(button.length).toEqual(1);
            expect(button[0].nativeElement.textContent.trim()).toEqual('See History');
        });
        it('based on whether something is selected', function() {
            expect(element.queryAll(By.css('.selected-entity div')).length).toBeGreaterThan(0);

            ontologyStateServiceStub.listItem.selected = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.selected-entity div')).length).toEqual(0);
        });
        it('depending on whether the selected entity is imported', function() {
            ontologyStateServiceStub.canModify.and.returnValue(true);
            fixture.detectChanges();
            const historyButton = element.queryAll(By.css('.selected-header button.btn-primary'))[0];
            const deleteButton = element.queryAll(By.css('.selected-header button.btn-danger'))[0];
            expect(historyButton.properties['disabled']).toBeFalsy();
            expect(deleteButton.properties['disabled']).toBeFalsy();

            ontologyStateServiceStub.isSelectedImported.and.returnValue(true);
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
            expect(ontologyStateServiceStub.listItem.seeHistory).toEqual(true);
        });
        it('if it is a concept', function() {
            ontologyManagerServiceStub.isConcept.and.returnValue(true);
            ontologyManagerServiceStub.isConceptScheme.and.returnValue(false);
            component.deleteEntity();
            expect(ontologyManagerServiceStub.isConcept).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected, ontologyStateServiceStub.listItem.derivedConcepts);
            expect(ontologyStateServiceStub.deleteConcept).toHaveBeenCalled();
            expect(ontologyStateServiceStub.deleteConceptScheme).not.toHaveBeenCalled();
        });
        it('if it is a concept scheme', function() {
            ontologyManagerServiceStub.isConcept.and.returnValue(false);
            ontologyManagerServiceStub.isConceptScheme.and.returnValue(true);
            component.deleteEntity();
            expect(ontologyManagerServiceStub.isConceptScheme).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.selected, ontologyStateServiceStub.listItem.derivedConceptSchemes);
            expect(ontologyStateServiceStub.deleteConcept).not.toHaveBeenCalled();
            expect(ontologyStateServiceStub.deleteConceptScheme).toHaveBeenCalled();
        });
    });
    it('should call seeHistory when the see history button is clicked', function() {
        spyOn(component, 'seeHistory');
        const button = element.queryAll(By.css('.selected-header button.btn-primary'))[0];
        button.triggerEventHandler('click', null);
        expect(component.seeHistory).toHaveBeenCalled();
    });
    it('should call showDeleteConfirmation when the delete button is clicked', function() {
        ontologyStateServiceStub.canModify.and.returnValue(true);
        fixture.detectChanges();
        spyOn(component, 'showDeleteConfirmation');
        const button = element.queryAll(By.css('.selected-header button.btn-danger'))[0];
        button.triggerEventHandler('click', null);
        expect(component.showDeleteConfirmation).toHaveBeenCalled();
    });
});
