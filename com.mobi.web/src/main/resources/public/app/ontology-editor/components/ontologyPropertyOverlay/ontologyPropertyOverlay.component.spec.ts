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
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OWL, XSD } from '../../../prefixes';
import { LanguageSelectComponent } from '../../../shared/components/languageSelect/languageSelect.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { IriSelectOntologyComponent } from '../iriSelectOntology/iriSelectOntology.component';
import { OntologyPropertyOverlayComponent } from './ontologyPropertyOverlay.component';

describe('Ontology Property Overlay component', function() {
    let component: OntologyPropertyOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyPropertyOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<OntologyPropertyOverlayComponent>>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const property = 'property1';
    const entityIRI = 'entity';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatAutocompleteModule,
                MatInputModule,
                MatFormFieldModule,
                MatRadioModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                OntologyPropertyOverlayComponent,
                MockComponent(LanguageSelectComponent),
                MockComponent(IriSelectOntologyComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(PropertyManagerService),
                MockProvider(ToastService),
                { provide: MAT_DIALOG_DATA, useValue: { editing: false } },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyPropertyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<OntologyPropertyOverlayComponent>>;
        propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {'@id': entityIRI};
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
        propertyManagerStub = null;
        toastStub = null;
    });

    describe('initializes with the correct data', function() {
        beforeEach(function() {
            ontologyStateStub.listItem.annotations.iris = {[property]: '', 'default2': '', 'owl2': ''};
            propertyManagerStub.ontologyProperties = ['ont1', 'ont2'];
            propertyManagerStub.defaultAnnotations = ['default1', 'default2'];
            propertyManagerStub.owlAnnotations = ['owl1', 'owl2'];
        });
        it('if an property is being edited', function() {
            component.data.editing = true;
            component.data.property = property;
            component.data.value = 'value';
            component.data.type = 'type';
            component.data.language = 'en';
            component.ngOnInit();
            expect(component.annotations).toEqual(['default1', 'default2', 'owl1', 'owl2', property]);
            expect(component.properties).toEqual(['ont1', 'ont2', 'default1', 'default2', 'owl1', 'owl2', property]);
            expect(component.propertyForm.controls.property.value).toEqual(property);
            expect(component.propertyForm.controls.property.disabled).toBeTrue();
            expect(component.propertyForm.controls.value.value).toEqual('value');
            expect(component.propertyForm.controls.type.value).toEqual('type');
            expect(component.propertyForm.controls.language.value).toEqual('en');
        });
        it('if an property is being edited and input data type value is empty', function() {
            component.data.editing = true;
            component.data.property = property;
            component.data.value = 'value';
            component.data.type = '';
            component.ngOnInit();
            expect(component.annotations).toEqual(['default1', 'default2', 'owl1', 'owl2', property]);
            expect(component.properties).toEqual(['ont1', 'ont2', 'default1', 'default2', 'owl1', 'owl2', property]);
            expect(component.propertyForm.controls.property.value).toEqual(property);
            expect(component.propertyForm.controls.property.disabled).toBeTrue();
            expect(component.propertyForm.controls.value.value).toEqual('value');
            expect(component.propertyForm.controls.type.value).toEqual(`${XSD}string`);
            expect(component.propertyForm.controls.language.value).toEqual(undefined);
        });
        it('if a new property is being added', function() {
            component.data.editing = false;
            component.ngOnInit();
            expect(component.annotations).toEqual(['default1', 'default2', 'owl1', 'owl2', property]);
            expect(component.properties).toEqual(['ont1', 'ont2', 'default1', 'default2', 'owl1', 'owl2', property]);
            expect(component.propertyForm.controls.property.value).toEqual('');
            expect(component.propertyForm.controls.property.disabled).toBeFalse();
            expect(component.propertyForm.controls.value.value).toEqual('');
            expect(component.propertyForm.controls.type.value).toEqual(`${XSD}string`);
            expect(component.propertyForm.controls.language.value).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[aria-label="Property"]', 'mat-autocomplete'].forEach(test => {
            it(`with a ${test}`, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether a property is being edited', function() {
            [
                {
                    value: true,
                    heading: 'Edit Property',
                },
                {
                    value: false,
                    heading: 'Add Property',
                }
            ].forEach(function(test) {
                component.data.editing = test.value;
                component.ngOnInit();
                fixture.detectChanges();

                const header = element.queryAll(By.css('h1'))[0];
                expect(header).toBeTruthy();
                expect(header.nativeElement.textContent.trim()).toEqual(test.heading);
                const input = element.queryAll(By.css('input[aria-label="Property"]'))[0];
                expect(input).toBeTruthy();
                if (test.value) {
                    expect(input.properties['disabled']).toBeTruthy();
                } else {
                    expect(input.properties['disabled']).toBeFalsy();
                }
            });
        });
        it('depending on whether owl:deprecated is selected', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('textarea')).length).toEqual(1);
            expect(element.queryAll(By.css('language-select')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-radio-group')).length).toEqual(0);
            
            component.propertyForm.controls.property.setValue(`${OWL}deprecated`);
            fixture.detectChanges();
            expect(element.queryAll(By.css('textarea')).length).toEqual(0);
            expect(element.queryAll(By.css('language-select')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-radio-group')).length).toEqual(1);
        });
        it('depending on whether it is an ontology property', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('input[aria-label="Value"]')).length).toEqual(0);

            component.isOntologyProperty = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('input[aria-label="Value"]')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('depending on the validity of the form', function() {
            component.data.editing = false;
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeTruthy();
            
            component.propertyForm.controls.property.setValue('test');
            component.propertyForm.controls.value.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should correctly group and filter the list of annotations', function() {
            ontologyStateStub.getEntityName.and.callFake(a => a);
            component.properties = ['http://A#prop1', 'http://B#prop3', 'http://A#prop2', 'http://C#other'];
            expect(component.filter('PROP')).toEqual([
                { namespace: 'http://A#', options: [
                    { property: 'http://A#prop1', name: 'http://A#prop1' },
                    { property: 'http://A#prop2', name: 'http://A#prop2' },
                ]},
                { namespace: 'http://B#', options: [
                    { property: 'http://B#prop3', name: 'http://B#prop3' },
                ]}
            ]);
        });
        describe('should submit the modal if the annotation is being', function() {
            beforeEach(function() {
                spyOn(component, 'addProperty');
                spyOn(component, 'editProperty');
            });
            it('added', function() {
                component.data.editing = false;
                component.submit();
                expect(component.addProperty).toHaveBeenCalledWith();
                expect(component.editProperty).not.toHaveBeenCalled();
            });
            it('edited', function() {
                component.data.editing = true;
                component.submit();
                expect(component.addProperty).not.toHaveBeenCalled();
                expect(component.editProperty).toHaveBeenCalledWith();
            });
        });
        describe('selectProp should set the correct state if it is', function() {
            it('owl:deprecated', function() {
                const event: MatAutocompleteSelectedEvent = {
                    option: {
                        value: `${OWL}deprecated`
                    }
                } as MatAutocompleteSelectedEvent;
                component.selectProp(event);
                expect(component.isOntologyProperty).toBeFalse();
                expect(component.propertyForm.controls.type.value).toEqual(`${XSD}boolean`);
                expect(component.propertyForm.controls.language.value).toEqual('');
            });
            it('not owl:deprecated and is an ontology property', function() {
                const event: MatAutocompleteSelectedEvent = {
                    option: {
                        value: 'test'
                    }
                } as MatAutocompleteSelectedEvent;
                propertyManagerStub.ontologyProperties = ['test'];
                component.selectProp(event);
                expect(component.isOntologyProperty).toBeTrue();
                expect(component.propertyForm.controls.type.value).toEqual(`${XSD}anyURI`);
                expect(component.propertyForm.controls.language.value).toEqual('');
            });
        });
        describe('addProperty calls the correct manager functions', function() {
            beforeEach(function() {
                ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
                component.propertyForm.controls.property.setValue(property);
                component.propertyForm.controls.value.setValue('value');
                component.propertyForm.controls.type.setValue(`${XSD}string`);
                propertyManagerStub.addValue.and.returnValue(true);
            });
            describe('when isOntologyProperty is true', function() {
                beforeEach(function() {
                    component.isOntologyProperty = true;
                });
                it('unless it is a duplicate value', function() {
                    propertyManagerStub.addId.and.returnValue(false);
                    component.addProperty();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, 'value');
                    expect(propertyManagerStub.addValue).not.toHaveBeenCalled();
                    expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith(false);
                });
                it('successfully', function() {
                    propertyManagerStub.addId.and.returnValue(true);
                    component.addProperty();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, 'value');
                    expect(propertyManagerStub.addValue).not.toHaveBeenCalled();
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
                      '@id': ontologyStateStub.listItem.selected['@id'],
                      [property]: [{ '@id': 'value' }]
                    });
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
            });
            describe('when isOntologyProperty is false', function() {
                beforeEach(function() {
                    component.isOntologyProperty = false;
                    propertyManagerStub.createValueObj.and.returnValue({'@value': 'value'});
                });
                it('unless it is a duplicate value', function() {
                    propertyManagerStub.addValue.and.returnValue(false);
                    component.addProperty();
                    expect(propertyManagerStub.addId).not.toHaveBeenCalled();
                    expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, 'value', `${XSD}string`, '');
                    expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith(false);
                });
                it('successfully', function() {
                    propertyManagerStub.addValue.and.returnValue(true);
                    component.addProperty();
                    expect(propertyManagerStub.addId).not.toHaveBeenCalled();
                    expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, 'value', `${XSD}string`, '');
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
                      '@id': ontologyStateStub.listItem.selected['@id'],
                      [property]: [{ '@value': 'value' }]
                    });
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
            });
        });
        describe('editProperty calls the correct manager functions', function() {
            beforeEach(function() {
                ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
                component.propertyForm.controls.property.setValue(property);
                component.propertyForm.controls.value.setValue('value');
                component.propertyForm.controls.type.setValue(`${XSD}string`);
            });
            describe('when isOntologyProperty is true', function() {
                beforeEach(function() {
                    component.isOntologyProperty = true;
                });
                it('unless it is a duplicate value', function() {
                    propertyManagerStub.editId.and.returnValue(false);
                    component.editProperty();
                    expect(propertyManagerStub.editId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, component.data.index, 'value');
                    expect(propertyManagerStub.editValue).not.toHaveBeenCalled();
                    expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
                    expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith(false);
                });
                it('successfully', function() {
                    propertyManagerStub.editId.and.returnValue(true);
                    component.editProperty();
                    expect(propertyManagerStub.editId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, component.data.index, 'value');
                    expect(propertyManagerStub.editValue).not.toHaveBeenCalled();
                    expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
                      '@id': ontologyStateStub.listItem.selected['@id'],
                      [property]: [{ '@id': undefined }]
                    });
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
                      '@id': ontologyStateStub.listItem.selected['@id'],
                      [property]: [{ '@id': 'value' }]
                    });
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
            });
            describe('when isOntologyProperty is false', function() {
                beforeEach(function() {
                    component.isOntologyProperty = false;
                    propertyManagerStub.createValueObj.and.returnValue({'@value': 'value'});
                });
                it('unless it is a duplicate value', function() {
                    propertyManagerStub.editValue.and.returnValue(false);
                    component.editProperty();
                    expect(propertyManagerStub.editId).not.toHaveBeenCalled();
                    expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, component.data.index, 'value', `${XSD}string`, '');
                    expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
                    expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith(false);
                });
                it('successfully', function() {
                    propertyManagerStub.editValue.and.returnValue(true);
                    component.editProperty();
                    expect(propertyManagerStub.editId).not.toHaveBeenCalled();
                    expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, property, component.data.index, 'value', `${XSD}string`, '');
                    expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
                      '@id': ontologyStateStub.listItem.selected['@id'],
                      [property]: [{ '@value': 'value' }]
                    });
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, {
                      '@id': ontologyStateStub.listItem.selected['@id'],
                      [property]: [{ '@value': 'value' }]
                    });
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call download when the button is clicked', function() {
        spyOn(component, 'submit');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.submit).toHaveBeenCalledWith();
    });
});
