import { DebugElement } from '@angular/core';
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
    cleanStylesFromDOM, mockUtil
} from '../../../../../../test/ts/Shared';
import { SharedModule } from "../../../shared/shared.module";
import { PreferenceConstants } from '../../classes/preferenceConstants.class';
import { PreferenceFormFieldComponent } from '../preferenceFormField/preferenceFormField.component';
import { FormGroup, FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('Preference Form Field component', function() {
    let component: PreferenceFormFieldComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PreferenceFormFieldComponent>;
    let formGroup;
    let field;
    let shaclShape;
    let utilStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                SharedModule,
                NoopAnimationsModule,
            ],
            declarations: [
                PreferenceFormFieldComponent
            ],
            providers: [
                { provide: 'utilService', useClass: mockUtil }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PreferenceFormFieldComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.get('utilService');

        formGroup = new FormGroup({
            'http://mobi.com/ontologies/preference#hasDataValue': new FormControl('firstVal')
        });

        field = PreferenceConstants.HAS_DATA_VALUE;

        shaclShape = {
            "@id" : "http://mobi.com/ontologies/preference#SomeSimpleTextPreferencePropertyShape",
            "@type" : [ "http://www.w3.org/ns/shacl#PropertyShape" ],
            "http://mobi.com/ontologies/preference#usesFormField" : [ {
              "@id" : "http://mobi.com/ontologies/preference#TextInput"
            } ],
            "http://www.w3.org/ns/shacl#datatype" : [ {
              "@id" : "http://www.w3.org/2001/XMLSchema#string"
            } ],
            "http://www.w3.org/ns/shacl#name" : [ {
              "@value" : "Some simple text field"
            } ],
            "http://www.w3.org/ns/shacl#maxCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "2"
            } ],
            "http://www.w3.org/ns/shacl#minCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "1"
            } ],
            "http://www.w3.org/ns/shacl#path" : [ {
              "@id" : "http://mobi.com/ontologies/preference#hasDataValue"
            } ]
        };

        component.fieldFormGroup = formGroup;
        component.fieldShaclProperty = field;
        component.shaclShape = shaclShape;
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        describe('onChanges', function() {
            describe('should set label', function() {
                it('when a shacl name exists', function() {
                    component.ngOnChanges();
                    expect(component.label).toEqual('Some simple text field');
                });
                it('when a shacl name does not exist', function() {
                    delete component.shaclShape['http://www.w3.org/ns/shacl#name'];
                    fixture.detectChanges();
                    component.ngOnChanges();
                    expect(component.label).toEqual('');
                });
            });
            describe('should set the form type correctly', function() {
                it('when rdf declares a text input field', function() {
                    component.ngOnChanges();
                    expect(component.formType).toEqual('textInput');
                });
                it('when rdf declares a toggle input field', function() {
                    component.shaclShape['http://mobi.com/ontologies/preference#usesFormField'] = [{
                        "@id" : "http://mobi.com/ontologies/preference#ToggleInput"
                    }];
                    component.ngOnChanges();
                    expect(component.formType).toEqual('toggle');
                });
                it('when rdf declares a radio input field', function() {
                    component.shaclShape['http://mobi.com/ontologies/preference#usesFormField'] = [{
                        "@id" : "http://mobi.com/ontologies/preference#RadioInput"
                    }];
                    component.ngOnChanges();
                    expect(component.formType).toEqual('radio');
                });
                it('when rdf declares an unsupported input field', function() {
                    component.shaclShape['http://mobi.com/ontologies/preference#usesFormField'] = [{
                        "@id" : "http://mobi.com/ontologies/preference#UnknownInput"
                    }];
                    component.ngOnChanges();
                    expect(component.formType).toEqual('');
                    expect(utilStub.createErrorToast).toHaveBeenCalled();
                });
                it('when rdf declares no input field', function() {
                    delete component.shaclShape['http://mobi.com/ontologies/preference#usesFormField'];
                    component.ngOnChanges();
                    expect(component.formType).toEqual('');
                    expect(utilStub.createErrorToast).toHaveBeenCalled();
                });
            });
            describe('should set validators correctly', function() {
                it('when a min count exists', function() {
                    component.shaclShape['http://www.w3.org/ns/shacl#pattern'] = [{
                        "@value" : "[a-zA-Z ]*"
                    }];
                    component.ngOnChanges();
                    component.fieldFormControl.setValue('');
                    expect(component.fieldFormControl.valid).toEqual(false);
                });
                it('when a min count does not exist', function() {
                    delete component.shaclShape['http://www.w3.org/ns/shacl#minCount'];
                    component.ngOnChanges();
                    component.fieldFormControl.setValue('');
                    expect(component.fieldFormControl.valid).toEqual(true);
                });
                it('when a shacl pattern exists', function() {
                    component.shaclShape['http://www.w3.org/ns/shacl#pattern'] = [{
                        "@value" : "[a-zA-Z ]*"
                    }];
                    component.ngOnChanges();

                    component.fieldFormControl.setValue('A dog');
                    expect(component.fieldFormControl.valid).toEqual(true);
                    component.fieldFormControl.setValue('1 dog');
                    expect(component.fieldFormControl.valid).toEqual(false);
                });
                it('when a shacl pattern does not exist', function() {
                    component.ngOnChanges();

                    component.fieldFormControl.setValue('A dog');
                    expect(component.fieldFormControl.valid).toEqual(true);
                    component.fieldFormControl.setValue('1 dog');
                    expect(component.fieldFormControl.valid).toEqual(true);
                });
                it('when shacl datatype is integer', function() {
                    component.shaclShape['http://www.w3.org/ns/shacl#datatype'] = [{
                        '@id' : 'http://www.w3.org/2001/XMLSchema#integer'
                    }];
                    component.ngOnChanges();

                    component.fieldFormControl.setValue('A dog');
                    expect(component.fieldFormControl.valid).toEqual(false);

                    component.fieldFormControl.setValue('22');
                    expect(component.fieldFormControl.valid).toEqual(true);
                });
            });
        });
    });
    describe('has the correct html', function() {
        it('when the formType is toggle', function() {
            component.formType = 'toggle';
            component.label = 'Toggle field label';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.toggle-field')).length).toEqual(1);
            expect(element.queryAll(By.css('.radio-group')).length).toEqual(0);
            expect(element.queryAll(By.css('.text-input-field')).length).toEqual(0);
        });
        it('when the formType is radio', function() {
            component.formType = 'radio';
            component.label = 'Radio group label';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.toggle-field')).length).toEqual(0);
            expect(element.queryAll(By.css('.radio-group')).length).toEqual(1);
            expect(element.queryAll(By.css('.text-input-field')).length).toEqual(0);
        });
        it('when the formType is text input', function() {
            component.formType = 'textInput';
            component.label = 'Text field label';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.toggle-field')).length).toEqual(0);
            expect(element.queryAll(By.css('.radio-group')).length).toEqual(0);
            expect(element.queryAll(By.css('.text-input-field')).length).toEqual(1);
        });
    });
});