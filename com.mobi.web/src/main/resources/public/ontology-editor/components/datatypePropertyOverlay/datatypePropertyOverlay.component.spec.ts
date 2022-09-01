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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    mockUtil,
    mockPropertyManager,
    cleanStylesFromDOM,
    mockOntologyState,
} from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DatatypePropertyOverlayComponent } from './datatypePropertyOverlay.component';
import { DatatypePropertyBlockComponent } from '../datatypePropertyBlock/datatypePropertyBlock.component';
import { configureTestSuite } from 'ng-bullet';
import { RDF, XSD } from '../../../prefixes';
import { LanguageSelectComponent } from '../../../shared/components/languageSelect/languageSelect.component';
import {
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatDialogRef,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MAT_DIALOG_DATA
} from '@angular/material';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('Datatype Property Overlay component', function() {
    let element: DebugElement;
    let component: DatatypePropertyOverlayComponent;
    let nativeElement: HTMLElement;
    let fixture:ComponentFixture<DatatypePropertyOverlayComponent>;
    let ontologyStateStub;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<DatatypePropertyBlockComponent>>;
    let utilStub;
    let propertyManagerStub;

    const error = 'error';
    let data = {
        editingProperty: false,
        propertySelect: 'id',
        propertyValue: 'sd',
        propertyType: XSD + 'string',
        propertyIndex: 0,
        propertyLanguage: 'en'
    };

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
                BrowserAnimationsModule, 
                MatAutocompleteModule
            ],
            declarations: [
                DatatypePropertyOverlayComponent,
                MockComponent(LanguageSelectComponent),
            ],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: OntologyStateService, useClass: mockOntologyState },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'propertyManagerService', useClass: mockPropertyManager },
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
        matDialogRef = TestBed.get(MatDialogRef);
        utilStub = TestBed.get('utilService');
        propertyManagerStub = TestBed.get('propertyManagerService');
        ontologyStateStub = TestBed.get(OntologyStateService);
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

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            fixture.detectChanges();
            expect(nativeElement.querySelectorAll('.datatype-property-overlay').length).toEqual(1);
            expect(nativeElement.querySelectorAll('.datatype-property-overlay-form').length).toEqual(1);
            expect(nativeElement.querySelectorAll('.datatype-property-overlay-actions').length).toEqual(1);
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
        it('with a mat-select', function() {
            fixture.detectChanges();
            expect(nativeElement.querySelectorAll('mat-autocomplete').length).toEqual(1);
        });
        it('with a text-area', function() {
            fixture.detectChanges();
            expect(nativeElement.querySelectorAll('textarea').length).toEqual(1);
        })
        // it('with an iri-select-ontology', function() {
        //     expect(nativeElement.querySelectorAll('iri-select-ontology').length).toEqual(1);
        // });
        it('depending on whether the type is rdf:langString', function() {
            const isLangStringSpy = spyOn(component, 'isLangString');
            isLangStringSpy.and.returnValue(false);
            fixture.detectChanges();
            expect(nativeElement.querySelectorAll('language-select').length).toEqual(0);
            isLangStringSpy.and.returnValue(true);
            fixture.detectChanges();
            expect(nativeElement.querySelectorAll('language-select').length).toEqual(1);
        });
        it('with  nabuttons to submit and cancel', function() {
            const buttons = nativeElement.querySelectorAll('.datatype-property-overlay-actions button');
            fixture.detectChanges();
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit'].indexOf(buttons[0].textContent.trim()) >= 0).toEqual(true);
            expect(['Cancel', 'Submit'].indexOf(buttons[1].textContent.trim()) >= 0).toEqual(true);
        });
    });
    describe('controller methods', function() {
        describe('should determine if Submit should be disabled if the property is being', function() {
            beforeEach(function() {
                component.propertyForm.controls.propertySelect.setErrors({
                    incorrect: false
                });

                component.data.propertyValue = 'test';
                component.data.propertySelect = 'test';
            });
            describe('added and', function() {
                it('the form is invalid', function() {
                    component.propertyForm.controls.propertySelect.setErrors({
                        incorrect: true
                    });
                    expect(component.isDisabled()).toEqual(true);
                });
                it('the value is not set', function() {
                    component.data.propertyValue = '';
                    fixture.detectChanges();
                    expect(component.isDisabled()).toEqual(true);
                });
                it('the annotation is not set', function() {
                    component.data.propertyValue = undefined;
                    fixture.detectChanges();
                    expect(component.isDisabled()).toEqual(true);
                });
                it('everything is valid and set', function() {
                    component.data.editingProperty = true;
                    component.propertyForm.controls.propertySelect.setErrors({
                        incorrect: true
                    });
                    component.data.propertyValue = 'value'
                    fixture.detectChanges();
                    expect(component.isDisabled()).toEqual(false);
                });
            });
            describe('edited and', function() {
                beforeEach(function() {
                    component.data.editingProperty = true;
                });
                it('the form is invalid', function() {
                    component.propertyForm.controls.propertySelect.setErrors({
                        incorrect: true
                    });
                    //fixture.detectChanges();
                    expect(component.isDisabled()).toEqual(true);
                });
                it('the value is not set', function() {
                    component.data.propertyValue = '';
                    fixture.detectChanges();
                    expect(component.isDisabled()).toEqual(true);
                });
                it('everything is valid and set', function() {
                    fixture.detectChanges();
                    expect(component.isDisabled()).toEqual(false);
                });
            });
        });
        describe('should submit the modal if the property is being', function() {
            beforeEach(function() {
                spyOn(component, 'addProperty');
                spyOn(component, 'editProperty');
            });
            it('added', function() {
                component.data.editingProperty = false;
                component.submit();
                expect(component.addProperty).toHaveBeenCalled();
                expect(component.editProperty).not.toHaveBeenCalled();
            });
            it('edited', function() {
                component.data.editingProperty = true;
                component.submit();
                expect(component.addProperty).not.toHaveBeenCalled();
                expect(component.editProperty).toHaveBeenCalled();
            });
        });
        describe('should add a data property', function() {
            beforeEach(function() {
                data.propertyValue = 'value';
                data.propertySelect = 'prop';
                data.propertyType = 'type';
                data.propertyLanguage = 'en';
                component.propertyForm.controls.propertySelect.setValue('prop')
                component.propertyForm.controls.propertyValue.setValue('value');
                ontologyStateStub.listItem.selected =  {
                    '@id': 'id',
                    'prop1': [{'@id': 'value1'}],
                    'prop2': [{'@value': 'value2', '@type': '', '@language': 'language'}]
                };
                component.data.propertyValue = 'value';
                propertyManagerStub.addValue.and.returnValue(true);
                spyOn(component, 'isLangString').and.returnValue(true);
                ontologyStateStub.saveCurrentChanges.and.returnValue(of([]));
            });
            it('unless it is a duplicate value', function() {
        
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                propertyManagerStub.addValue.and.returnValue(false);
                //this.pm.addValue(this.os.listItem.selected, select, value, realType, lang);
                component.addProperty();

                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, data.propertySelect, data.propertyValue,  realType, lang);
                expect(utilStub.createJson).not.toHaveBeenCalled();
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(utilStub.createWarningToast).toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalled();
            });
            it('without a type and no language', function() {
                component.data.propertyLanguage = '';
                component.data.propertyType = '';
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, data.propertySelect, data.propertyValue, realType, lang);
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'], data.propertySelect, {});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalled();
            });
            it('with a language and isLangString is true', function() {
                component.data.propertyLanguage = 'en';
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, data.propertySelect, data.propertyValue, realType, lang);
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalled();
            });
            it('with a language and isLangString is false', function() {
                component.isLangString = jasmine.createSpy().and.returnValue(false);
                component.data.propertyLanguage = '';
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, data.propertySelect, data.propertyValue, realType, lang);
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalled();
            });
            it('without a language', function() {
                component.data.propertyLanguage = '';
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                component.addProperty();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected,
                    data.propertySelect,
                    data.propertyValue,
                    realType,
                    lang);
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
        });
        describe('should edit a data property', function() {
            beforeEach(function() {
                data = {
                    editingProperty: false,
                    propertySelect: 'prop2',
                    propertyValue: 'sd',
                    propertyType: XSD + 'string',
                    propertyIndex: 0,
                    propertyLanguage: 'en'
                };
                ontologyStateStub.listItem.selected =  {
                    '@id': 'prop2',
                    'prop1': [{'@id': 'value1'}],
                    'prop2': [{'@value': 'value2', '@type': '', '@language': 'language'}]
                };

                component.propertyForm.controls.propertySelect.setValue('prop2');
                component.propertyForm.controls.propertyValue.setValue('sd');
                ontologyStateStub.listItem.selected['prop2'] = [{}];
                component.data.propertyIndex = 0;
                component.data.propertyType = XSD + 'string';
                propertyManagerStub.editValue.and.returnValue(true);
                spyOn(component, 'isLangString').and.returnValue(true);
                propertyManagerStub.createValueObj.and.returnValue({id: 'newValue'});
                ontologyStateStub.saveCurrentChanges.and.returnValue(of([]));
            });
            it('unless it is a duplicate value', function() {
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                propertyManagerStub.editValue.and.returnValue(false);
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected,
                    data.propertySelect,
                    data.propertyIndex,
                    data.propertyValue, realType, lang);
                expect(utilStub.createJson).not.toHaveBeenCalled();
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(utilStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the type is provided and no language', function() {
                component.data.propertyLanguage = '';
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, data.propertySelect,
                    component.data.propertyIndex, data.propertyValue, realType, lang);
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {});
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {id: 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the type is not provided and no language', function() {
                component.data.propertyLanguage = '';
                component.data.propertyType = '';
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected,data.propertySelect,
                    component.data.propertyIndex, data.propertyValue, realType, lang);
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {});
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {id: 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the language is provided and isLangString is true', function() {
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected,data.propertySelect, component.data.propertyIndex, data.propertyValue, realType, lang);
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {});
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {id: 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the language is provided and isLangString is false', function() {
                component.isLangString = jasmine.createSpy().and.returnValue(false);
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected,
                    data.propertySelect, data.propertyIndex, data.propertyValue, data.propertyType, '');
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {});
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {id: 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if the language is not provided', function() {
                component.data.propertyLanguage = '';
                const realType = component.getType(component.data.propertyLanguage, component.data.propertyType);
                const lang = component.getLang(component.data.propertyLanguage);
                component.editProperty();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, data.propertySelect, data.propertyIndex, data.propertyValue, realType, lang);
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {});
                expect(utilStub.createJson).toHaveBeenCalledWith(ontologyStateStub.listItem.selected['@id'],data.propertySelect, {id: 'newValue'});
                expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
        });
        describe('should determine if type if a string type', function() {
            it('when undefined', function() {
                component.data.propertyType = undefined;
                expect(component.isLangString()).toEqual(false);
            });
            it('when it is not a string type', function() {
                component.data.propertyType = 'wrong';
                expect(component.isLangString()).toEqual(false);
            });
            it('when it is a string type', function() {
                component.data.propertyType = RDF + 'langString';
                expect(component.isLangString()).toEqual(true);
            });
        });
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
