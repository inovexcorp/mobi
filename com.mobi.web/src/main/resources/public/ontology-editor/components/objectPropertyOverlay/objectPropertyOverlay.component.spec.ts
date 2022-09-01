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
import {DebugElement} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    MatButtonModule,
    MatDialogModule,
    MatDialogRef,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MAT_DIALOG_DATA
} from '@angular/material';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    mockUtil,
    mockPropertyManager,
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ObjectPropertyOverlayComponent } from './objectPropertyOverlay.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import {OWL} from '../../../prefixes';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { By } from '@angular/platform-browser';

describe('Object Property Overlay component', function() {
    let element: DebugElement;
    let component: ObjectPropertyOverlayComponent;
    let nativeElement: HTMLElement;
    let fixture:ComponentFixture<ObjectPropertyOverlayComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<ObjectPropertyOverlayComponent>>;
    let utilStub;
    let propertyManagerStub;
    const type = [OWL + 'NamedIndividual', 'type1', 'type2'];
    const listItem = new OntologyListItem();
    const entityIRI = 'entity';
    const data = {
        editingProperty: false,
        propertySelect: 'id',
        propertyValue: 'sd',
        propertyIndex: 0,
    };
    let property, value;
    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatSelectModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                MatIconModule,
                MatDialogModule,
                MatAutocompleteModule,
                BrowserAnimationsModule
            ],
            declarations: [
                ObjectPropertyOverlayComponent,
            ],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: data },
                MockProvider(OntologyStateService),
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'propertyManagerService', useClass: mockPropertyManager },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ObjectPropertyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        nativeElement = element.nativeElement;
        matDialogRef = TestBed.get(MatDialogRef);
        utilStub = TestBed.get('utilService');
        propertyManagerStub = TestBed.get('propertyManagerService');
        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyStateStub.getActiveEntityIRI.and.returnValue('active');
        ontologyStateStub.listItem = listItem;        
        ontologyStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
        ontologyStateStub.listItem.individuals.iris = {active: 'ontology', indiv: 'ontology'};
        ontologyStateStub.listItem.selected = {'@id': entityIRI};
        component.data.propertyValue = 'indiv';
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        propertyManagerStub = null;
        matDialogRef = null;
        utilStub = null;
    });

    it('initializes with the correct values', function() {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.individuals).toEqual({indiv: 'ontology'});
    });
   describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(nativeElement.querySelectorAll('.object-property-overlay').length).toEqual(1);
            expect(nativeElement.querySelectorAll('form').length).toEqual(1);
            expect(nativeElement.querySelectorAll('.object-property-overlay-actions').length).toEqual(1);
        });
        ['h1', 'mat-autocomplete'].forEach(selector => {
            it('with a ' + selector, function() {
                expect(nativeElement.querySelectorAll(selector).length).toEqual(1);
            });
        });
        it('with buttons to submit and cancel', function() {
            const buttons = nativeElement.querySelectorAll('.object-property-overlay-actions button');
            fixture.detectChanges();
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit'].indexOf(buttons[0].textContent.trim()) >= 0).toEqual(true);
            expect(['Cancel', 'Submit'].indexOf(buttons[1].textContent.trim()) >= 0).toEqual(true);
        });
    });
    describe('controller methods', function() {
        describe('should add an object property', function() {
            beforeEach(function() {
                ontologyStateStub.listItem.selected = {
                    '@id': 'iri',
                    '@type': type,
                    'title': [{'@value': 'title'}]
                };
                value = 'value';
                property = 'prop';
                propertyManagerStub.addId.and.returnValue(true);
                component.objectPropertyForm.controls.propertyValue.setValue('value');
                component.objectPropertyForm.controls.propertySelect.setValue('prop');
                ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
            });
            it('unless it is a duplicate value', function() {
                propertyManagerStub.addId.and.returnValue(false);
                component.addProperty();
                expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, value);
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(utilStub.createWarningToast).toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalled();
            });
            describe('if the selected entity is', function() {
                it('a derived Concept or ConceptScheme', function() {
                    ontologyStateStub.containsDerivedConcept.and.returnValue(true);
                    component.addProperty();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, value);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalled();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalled();
                    expect(ontologyStateStub.containsDerivedConcept).toHaveBeenCalledWith(type);
                    expect(ontologyStateStub.updateVocabularyHierarchies).toHaveBeenCalledWith(property, [{'@id': value}]);
                });
                it('a derived ConceptScheme', function() {
                    ontologyStateStub.containsDerivedConceptScheme.and.returnValue(true);
                    component.addProperty();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property,  value);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalled();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalled();
                    expect(ontologyStateStub.containsDerivedConceptScheme).toHaveBeenCalledWith(type);
                    expect(ontologyStateStub.updateVocabularyHierarchies).toHaveBeenCalledWith(property, [{'@id': value}]);
                });
                it('not a derived Concept or ConceptScheme', function() {
                    component.addProperty();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, value);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalled();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalled();
                    expect(ontologyStateStub.containsDerivedConcept).toHaveBeenCalledWith(type);
                    expect(ontologyStateStub.containsDerivedConceptScheme).toHaveBeenCalledWith(type);
                    expect(ontologyStateStub.updateVocabularyHierarchies).not.toHaveBeenCalled();
                });
            });
        });
        // it('getValues should call the correct method', function() {
        //    /// ontologyStateStub.listItem = { objectProperties: { iris: {test: 'ontology'} } };
        //     ontologyStateStub.getSelectList.and.returnValue(['list']);
        //     //component.getValues('text');
        //     //expect(ontologyStateStub.getSelectList).toHaveBeenCalledWith(['test'], 'text', ontologyStateStub.getDropDownText);
        //     expect(component.valueList).toEqual(['list']);
        // });
        it('should cancel the overlay', function() {
            component.cancel();
            expect(matDialogRef.close).toHaveBeenCalled();
        });
    });
    it('should call addProperty when the button is clicked', function() {
        spyOn(component, 'addProperty');
        const button = element.queryAll(By.css('div[mat-dialog-actions] button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.addProperty).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(component, 'cancel');
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        expect(component.cancel).toHaveBeenCalled();
    });
});
