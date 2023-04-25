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
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { By } from '@angular/platform-browser';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OWL } from '../../../prefixes';
import { UtilService } from '../../../shared/services/util.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { IriSelectOntologyComponent } from '../iriSelectOntology/iriSelectOntology.component';
import { ObjectPropertyOverlayComponent } from './objectPropertyOverlay.component';

describe('Object Property Overlay component', function() {
    let element: DebugElement;
    let component: ObjectPropertyOverlayComponent;
    let nativeElement: HTMLElement;
    let fixture:ComponentFixture<ObjectPropertyOverlayComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<ObjectPropertyOverlayComponent>>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
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

    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
                MockComponent(IriSelectOntologyComponent)
            ],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: data },
                MockProvider(OntologyStateService),
                MockProvider(UtilService),
                MockProvider(PropertyManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ObjectPropertyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        nativeElement = element.nativeElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ObjectPropertyOverlayComponent>>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;

        ontologyStateStub.getActiveEntityIRI.and.returnValue('active');
        ontologyStateStub.listItem = listItem;        
        ontologyStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
        ontologyStateStub.listItem.individuals.iris = {active: 'ontology', indiv: 'ontology'};
        ontologyStateStub.listItem.selected = {'@id': entityIRI};
        component.propertyValue = ['indiv'];
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
        // TODO expand this
    });
   describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['mat-form-field', 'mat-autocomplete', 'iri-select-ontology'].forEach(selector => {
            it('with a ' + selector, function() {
                expect(nativeElement.querySelectorAll(selector).length).toEqual(1);
            });
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
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
                component.propertyValue = [value];
                component.objectPropertyForm.controls.propertySelect.setValue('prop');
                ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
                utilStub.createJson.and.returnValue({'@id': ''});
            });
            it('unless it is a duplicate value', function() {
                propertyManagerStub.addId.and.returnValue(false);
                component.addProperty();
                expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, value);
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(utilStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            describe('if the selected entity is', function() {
                it('a derived Concept or ConceptScheme', function() {
                    ontologyStateStub.containsDerivedConcept.and.returnValue(true);
                    component.addProperty();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, value);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(ontologyStateStub.containsDerivedConcept).toHaveBeenCalledWith(type);
                    expect(ontologyStateStub.updateVocabularyHierarchies).toHaveBeenCalledWith(property, [{'@id': value}]);
                });
                it('a derived ConceptScheme', function() {
                    ontologyStateStub.containsDerivedConceptScheme.and.returnValue(true);
                    component.addProperty();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property,  value);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(ontologyStateStub.containsDerivedConceptScheme).toHaveBeenCalledWith(type);
                    expect(ontologyStateStub.updateVocabularyHierarchies).toHaveBeenCalledWith(property, [{'@id': value}]);
                });
                it('not a derived Concept or ConceptScheme', function() {
                    component.addProperty();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, value);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                    expect(ontologyStateStub.containsDerivedConcept).toHaveBeenCalledWith(type);
                    expect(ontologyStateStub.containsDerivedConceptScheme).toHaveBeenCalledWith(type);
                    expect(ontologyStateStub.updateVocabularyHierarchies).not.toHaveBeenCalled();
                });
            });
        });
        // TODO add test for filter, getName
    });
    it('should call addProperty when the button is clicked', function() {
        spyOn(component, 'addProperty');
        const button = element.queryAll(By.css('div[mat-dialog-actions] button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.addProperty).toHaveBeenCalledWith();
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(false);
    });
});
