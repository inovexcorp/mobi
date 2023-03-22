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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DatatypePropertyBlockComponent } from '../datatypePropertyBlock/datatypePropertyBlock.component';
import { RDF, XSD } from '../../../prefixes';
import { LanguageSelectComponent } from '../../../shared/components/languageSelect/languageSelect.component';
import { UtilService } from '../../../shared/services/util.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { IriSelectOntologyComponent } from '../iriSelectOntology/iriSelectOntology.component';
import { DatatypePropertyOverlayComponent } from './datatypePropertyOverlay.component';

describe('Datatype Property Overlay component', function() {
    let element: DebugElement;
    let component: DatatypePropertyOverlayComponent;
    let nativeElement: HTMLElement;
    let fixture:ComponentFixture<DatatypePropertyOverlayComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<DatatypePropertyBlockComponent>>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;

    const data = {
        editingProperty: false,
        propertySelect: 'id',
        propertyValue: 'sd',
        propertyType: XSD + 'string',
        propertyIndex: 0,
        propertyLanguage: 'en'
    };

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
                BrowserAnimationsModule, 
                MatAutocompleteModule
            ],
            declarations: [
                DatatypePropertyOverlayComponent,
                MockComponent(LanguageSelectComponent),
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
        fixture = TestBed.createComponent(DatatypePropertyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        component = fixture.componentInstance;
        nativeElement = element.nativeElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DatatypePropertyBlockComponent>>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyStateStub.listItem = new OntologyListItem();

        ontologyStateStub.getGroupedSelectList.and.returnValue([]);
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

    // TODO: Initialize test
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('depending on whether the property is being edited', function() {
            [
                {
                    value: true,
                    header: 'Edit Datatype Property Value',
                },
                {
                    value: false,
                    header: 'Add Datatype Property Value',
                }
            ].forEach(test => {
                component.data.editingProperty = test.value;
                fixture.detectChanges();
                const header = nativeElement.querySelectorAll('h1');
                expect(header[0].textContent.trim()).toEqual(test.header);
                fixture.detectChanges();
            });
        });
        ['input[name="dataProperty"]', 'textarea', 'mat-autocomplete', 'iri-select-ontology'].forEach(test => {
            it('with a ' + test, function() {
                fixture.detectChanges();
                expect(nativeElement.querySelectorAll(test).length).toEqual(1);
            });
        });
        it('depending on whether the type is rdf:langString', function() {
            const isLangStringSpy = spyOn(component, 'isLangString');
            isLangStringSpy.and.returnValue(false);
            fixture.detectChanges();
            expect(nativeElement.querySelectorAll('language-select').length).toEqual(0);
            isLangStringSpy.and.returnValue(true);
            fixture.detectChanges();
            expect(nativeElement.querySelectorAll('language-select').length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    describe('controller methods', function() {
        describe('should submit the modal if the property is being', function() {
            beforeEach(function() {
                spyOn(component, 'addProperty');
                spyOn(component, 'editProperty');
            });
            it('added', function() {
                component.data.editingProperty = false;
                component.submit();
                expect(component.addProperty).toHaveBeenCalledWith();
                expect(component.editProperty).not.toHaveBeenCalled();
            });
            it('edited', function() {
                component.data.editingProperty = true;
                component.submit();
                expect(component.addProperty).not.toHaveBeenCalled();
                expect(component.editProperty).toHaveBeenCalledWith();
            });
        });
        describe('should add a data property', function() {
            beforeEach(function() {
                component.propertyType = ['type'];
                component.propertyForm.controls.propertySelect.setValue('prop');
                component.propertyForm.controls.propertyValue.setValue('value');
                component.propertyForm.controls.language.setValue('en');
                ontologyStateStub.listItem.selected =  {
                    '@id': 'id',
                    'prop1': [{'@id': 'value1'}],
                    'prop2': [{'@value': 'value2', '@type': '', '@language': 'language'}]
                };
                component.data.propertyValue = 'value';
                propertyManagerStub.addValue.and.returnValue(true);
                this.langStringSpy = spyOn(component, 'isLangString').and.returnValue(true);
                ontologyStateStub.saveCurrentChanges.and.returnValue(of([]));
                utilStub.createJson.and.returnValue({'@id': ''});
                propertyManagerStub.createValueObj.and.returnValue({'@value': ''});
            });
            it('unless it is a duplicate value', function() {
                propertyManagerStub.addValue.and.returnValue(false);
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop', 'value', '', 'en');
                expect(utilStub.createJson).not.toHaveBeenCalled();
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(utilStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('without a type and no language', function() {
                component.propertyForm.controls.language.setValue('');
                component.propertyType = [''];
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop', 'value', XSD + 'string', '');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop', jasmine.any(Object));
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
            });
            it('with a language and isLangString is true', function() {
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop', 'value', '', 'en');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop', jasmine.any(Object));
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('with a language and isLangString is false', function() {
                this.langStringSpy.and.returnValue(false);
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop', 'value', 'type', '');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop', jasmine.any(Object));
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('without a language', function() {
                component.propertyForm.controls.language.setValue('');
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop', 'value', 'type', '');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop', jasmine.any(Object));
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
        });
        describe('should edit a data property', function() {
            beforeEach(function() {
                component.data.propertyIndex = 0;
                ontologyStateStub.listItem.selected =  {
                    '@id': 'prop2',
                    'prop1': [{'@id': 'value1'}],
                    'prop2': [{'@value': 'value2', '@type': '', '@language': 'language'}]
                };
                component.propertyForm.controls.propertySelect.setValue('prop2');
                component.propertyForm.controls.propertyValue.setValue('sd');
                component.propertyForm.controls.language.setValue('en');
                component.propertyType = ['type'];
                ontologyStateStub.listItem.selected['prop2'] = [{}];
                propertyManagerStub.editValue.and.returnValue(true);
                this.isLangStringSpy = spyOn(component, 'isLangString').and.returnValue(true);
                propertyManagerStub.createValueObj.and.returnValue({'@value': 'newValue'});
                ontologyStateStub.saveCurrentChanges.and.returnValue(of([]));
                utilStub.createJson.and.returnValue({'@id': ''});
            });
            it('unless it is a duplicate value', function() {
                propertyManagerStub.editValue.and.returnValue(false);
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop2', data.propertyIndex, 'sd', '', 'en');
                expect(utilStub.createJson).not.toHaveBeenCalled();
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(utilStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the type is provided and no language', function() {
                component.propertyForm.controls.language.setValue('');
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop2', component.data.propertyIndex, 'sd', 'type', '');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', jasmine.any(Object));
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', {'@value': 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the type is not provided and no language', function() {
                component.propertyForm.controls.language.setValue('');
                component.propertyType = [''];
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop2', component.data.propertyIndex, 'sd', XSD + 'string', '');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', jasmine.any(Object));
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', {'@value': 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the language is provided and isLangString is true', function() {
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop2', component.data.propertyIndex, 'sd', '', 'en');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', jasmine.any(Object));
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', {'@value': 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the language is provided and isLangString is false', function() {
                this.isLangStringSpy.and.returnValue(false);
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop2', data.propertyIndex, 'sd', 'type', '');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', jasmine.any(Object));
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', {'@value': 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the language is not provided', function() {
                component.propertyForm.controls.language.setValue('');
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, 'prop2', data.propertyIndex, 'sd', 'type', '');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', jasmine.any(Object));
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], 'prop2', {'@value': 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
        });
        describe('should determine if type if a string type', function() {
            it('when undefined', function() {
                component.propertyType = undefined;
                expect(component.isLangString()).toEqual(false);
            });
            it('when it is not a string type', function() {
                component.propertyType = ['wrong'];
                expect(component.isLangString()).toEqual(false);
            });
            it('when it is a string type', function() {
                component.propertyType = [RDF + 'langString'];
                expect(component.isLangString()).toEqual(true);
            });
        });
        // TODO tests for filter, getName
    });
    it('should call submit when the button is clicked', function() {
        spyOn(component, 'submit');
        const button = element.queryAll(By.css('div[mat-dialog-actions] button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.submit).toHaveBeenCalledWith();
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
});
