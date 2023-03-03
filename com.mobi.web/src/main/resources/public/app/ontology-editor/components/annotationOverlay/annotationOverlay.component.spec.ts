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
import { DCTERMS, OWL, XSD } from '../../../prefixes';
import { LanguageSelectComponent } from '../../../shared/components/languageSelect/languageSelect.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { AnnotationOverlayComponent } from './annotationOverlay.component';

describe('Annotation Overlay component', function() {
    let component: AnnotationOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<AnnotationOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<AnnotationOverlayComponent>>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const annotation = 'annotation1';
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
                AnnotationOverlayComponent,
                MockComponent(LanguageSelectComponent),
            ],
            providers: [
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
                MockProvider(PropertyManagerService),
                MockProvider(UtilService),
                { provide: MAT_DIALOG_DATA, useValue: { editing: false } },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(AnnotationOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AnnotationOverlayComponent>>;
        propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        
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
        ontologyManagerStub = null;
        propertyManagerStub = null;
        utilStub = null;
    });

    describe('initializes with the correct data', function() {
        beforeEach(function() {
            ontologyStateStub.listItem.annotations.iris = {[annotation]: '', 'default2': '', 'owl2': ''};
            propertyManagerStub.defaultAnnotations = ['default1', 'default2'];
            propertyManagerStub.owlAnnotations = ['owl1', 'owl2'];
        });
        it('if an annotation is being edited', function() {
            component.data.editing = true;
            component.data.annotation = annotation;
            component.data.value = 'value';
            component.data.type = 'type';
            component.data.language = 'en';
            component.ngOnInit();
            expect(component.annotations).toEqual([annotation, 'default2', 'owl2', 'default1', 'owl1']);
            expect(component.annotationForm.controls.annotation.value).toEqual(annotation);
            expect(component.annotationForm.controls.annotation.disabled).toBeTrue();
            expect(component.annotationForm.controls.value.value).toEqual('value');
            expect(component.annotationForm.controls.type.value).toEqual('type');
            expect(component.annotationForm.controls.language.value).toEqual('en');
        });
        it('if a new annotation is being added', function() {
            component.data.editing = false;
            component.ngOnInit();
            expect(component.annotations).toEqual([annotation, 'default2', 'owl2', 'default1', 'owl1']);
            expect(component.annotationForm.controls.annotation.value).toEqual('');
            expect(component.annotationForm.controls.annotation.disabled).toBeFalse();
            expect(component.annotationForm.controls.value.value).toEqual('');
            expect(component.annotationForm.controls.type.value).toEqual('');
            expect(component.annotationForm.controls.language.value).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[aria-label="Annotation"]', 'mat-autocomplete'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('has correct content based on whether the annotation is being edited', function() {
            [
                {
                    value: true,
                    result: 'Edit Annotation',
                    
                },
                {
                    value: false,
                    result: 'Add Annotation'
                }
            ].forEach(function(test) {
                component.data.editing = test.value;
                component.ngOnInit();
                fixture.detectChanges();

                const header = element.queryAll(By.css('h1'))[0];
                expect(header).toBeTruthy();
                expect(header.nativeElement.textContent.trim()).toEqual(test.result);
                const input = element.queryAll(By.css('input[aria-label="Annotation"]'))[0];
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
            expect(element.queryAll(By.css('language-select')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-radio-group')).length).toEqual(0);
            
            component.annotationForm.controls.annotation.setValue(OWL + 'deprecated');
            fixture.detectChanges();
            expect(element.queryAll(By.css('textarea')).length).toEqual(0);
            expect(element.queryAll(By.css('language-select')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-radio-group')).length).toEqual(1);
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
            
            component.annotationForm.controls.annotation.setValue('test');
            component.annotationForm.controls.value.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should correctly group and filter the list of annotations', function() {
            utilStub.getIRINamespace.and.callFake(a => a[0]);
            ontologyStateStub.getEntityNameByListItem.and.callFake(a => a);
            spyOn(component, 'isPropDisabled').and.callFake(a => a === 'Aprop2');
            component.annotations = ['Aprop1', 'Bprop3', 'Aprop2', 'Cother'];
            expect(component.filter('PROP')).toEqual([
                { namespace: 'A', options: [
                    { annotation: 'Aprop1', disabled: false, name: 'Aprop1' },
                    { annotation: 'Aprop2', disabled: true, name: 'Aprop2' },
                ]},
                { namespace: 'B', options: [
                    { annotation: 'Bprop3', disabled: false, name: 'Bprop3' },
                ]}
            ]);
        });
        it('isPropDisabled should test whether an annotation value should be disabled', function() {
            expect(component.isPropDisabled('test')).toEqual(false);
            expect(component.isPropDisabled(OWL + 'deprecated')).toEqual(false);

            ontologyStateStub.listItem.selected[OWL + 'deprecated'] = [];
            expect(component.isPropDisabled(OWL + 'deprecated')).toEqual(true);
        });
        describe('selectProp should set the correct state if it is', function() {
            it('owl:deprecated', function() {
                const event: MatAutocompleteSelectedEvent = {
                    option: {
                        value: OWL + 'deprecated'
                    }
                } as MatAutocompleteSelectedEvent;
                component.selectProp(event);
                expect(component.annotationForm.controls.type.value).toEqual(XSD + 'boolean');
                expect(component.annotationForm.controls.language.value).toEqual('');
            });
            it('not owl:deprecated', function() {
                const event: MatAutocompleteSelectedEvent = {
                    option: {
                        value: 'test'
                    }
                } as MatAutocompleteSelectedEvent;
                component.selectProp(event);
                expect(component.annotationForm.controls.type.value).toEqual('');
                expect(component.annotationForm.controls.language.value).toEqual('en');
            });
        });
        describe('should submit the modal if the annotation is being', function() {
            beforeEach(function() {
                spyOn(component, 'addAnnotation');
                spyOn(component, 'editAnnotation');
            });
            it('added', function() {
                component.data.editing = false;
                component.submit();
                expect(component.addAnnotation).toHaveBeenCalledWith();
                expect(component.editAnnotation).not.toHaveBeenCalled();
            });
            it('edited', function() {
                component.data.editing = true;
                component.submit();
                expect(component.addAnnotation).not.toHaveBeenCalled();
                expect(component.editAnnotation).toHaveBeenCalledWith();
            });
        });
        describe('addAnnotation should call the appropriate manager functions if', function() {
            beforeEach(function() {
                ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
                component.annotationForm.controls.value.setValue('value');
                component.annotationForm.controls.type.setValue(XSD + 'string');
                utilStub.createJson.and.returnValue({'@id': ''});
            });
            describe('the value was added successfully', function() {
                beforeEach(function() {
                    propertyManagerStub.addValue.and.returnValue(true);
                    ontologyManagerStub.entityNameProps = [DCTERMS + 'title'];
                });
                it('and it is a name prop', function() {
                    component.annotationForm.controls.annotation.setValue(DCTERMS + 'title');
                    component.addAnnotation();
                    expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, DCTERMS + 'title', 'value', XSD + 'string', '');
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(ontologyStateStub.annotationModified).toHaveBeenCalledWith(entityIRI, DCTERMS + 'title', 'value');
                    expect(ontologyStateStub.updateLabel).toHaveBeenCalledWith();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
                it('and it is not a name prop', function() {
                    component.annotationForm.controls.annotation.setValue(annotation);
                    component.addAnnotation();
                    expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, annotation, 'value', XSD + 'string', '');
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(ontologyStateStub.annotationModified).toHaveBeenCalledWith(entityIRI, annotation, 'value');
                    expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
            });
            it('the value was not added successfully', function() {
                component.annotationForm.controls.annotation.setValue(annotation);
                propertyManagerStub.addValue.and.returnValue(false);
                component.addAnnotation();
                expect(propertyManagerStub.addValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, annotation, 'value', XSD + 'string', '');
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(ontologyStateStub.annotationModified).not.toHaveBeenCalled();
                expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
                expect(utilStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith(false);
            });
        });
        describe('editAnnotation should call the appropriate manager functions', function() {
            beforeEach(function() {
                ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
                component.annotationForm.controls.value.setValue('value');
                component.annotationForm.controls.type.setValue(XSD + 'string');
                component.data.index = 0;
                utilStub.createJson.and.returnValue({'@id': ''});
            });
            describe('if the value was edited successfully', function() {
                beforeEach(function() {
                    propertyManagerStub.editValue.and.returnValue(true);
                    ontologyManagerStub.entityNameProps = [DCTERMS + 'title'];
                });
                it('and it is a name prop', function() {
                    component.annotationForm.controls.annotation.setValue(DCTERMS + 'title');
                    component.editAnnotation();
                    expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, DCTERMS + 'title', 0, 'value', XSD + 'string', '');
                    expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(ontologyStateStub.annotationModified).toHaveBeenCalledWith(entityIRI, DCTERMS + 'title', 'value');
                    expect(ontologyStateStub.updateLabel).toHaveBeenCalledWith();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
                it('and it is not a name prop', function() {
                    component.annotationForm.controls.annotation.setValue(annotation);
                    component.editAnnotation();
                    expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, annotation, 0, 'value', XSD + 'string', '');
                    expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(ontologyStateStub.annotationModified).toHaveBeenCalledWith(entityIRI, annotation, 'value');
                    expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
                it('and it has a language', function() {
                    component.annotationForm.controls.annotation.setValue(annotation);
                    component.annotationForm.controls.language.setValue('en');
                    component.editAnnotation();
                    expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, annotation, 0, 'value', '', 'en');
                    expect(ontologyStateStub.addToDeletions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(ontologyStateStub.annotationModified).toHaveBeenCalledWith(entityIRI, annotation, 'value');
                    expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                });
            });
            it('if the value was not edited successfully', function() {
                component.annotationForm.controls.annotation.setValue(annotation);
                propertyManagerStub.editValue.and.returnValue(false);
                component.editAnnotation();
                expect(propertyManagerStub.editValue).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, annotation, 0, 'value', XSD + 'string', '');
                expect(ontologyStateStub.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(ontologyStateStub.annotationModified).not.toHaveBeenCalled();
                expect(ontologyStateStub.updateLabel).not.toHaveBeenCalled();
                expect(utilStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith(false);
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call submit when the button is clicked', function() {
        spyOn(component, 'submit');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.submit).toHaveBeenCalledWith();
    });
});
