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
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocompleteModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatProgressSpinnerModule, MatSelectModule, MatSlideToggleModule, MatTableModule, MatTabsModule, MatTooltipModule } from '@angular/material';
import { configureTestSuite } from 'ng-bullet';
import { get } from 'lodash';

import {
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { SettingConstants } from '../../models/settingConstants.class';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { SETTING, SHACL, XSD } from '../../../prefixes';
import { UtilService } from '../../services/util.service';
import { SettingFormFieldComponent } from './settingFormField.component';
import { MockProvider } from 'ng-mocks';

describe('Setting Form Field component', function() {
    let component: SettingFormFieldComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SettingFormFieldComponent>;
    let formGroup;
    let field;
    let shaclShape;
    let utilStub: jasmine.SpyObj<UtilService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatSlideToggleModule,
                FormsModule,
                ReactiveFormsModule,
                MatAutocompleteModule,
                MatMenuModule,
                MatDialogModule,
                MatTabsModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                MatProgressSpinnerModule,
                MatIconModule,
                MatSlideToggleModule,
                MatProgressSpinnerModule,
                MatTableModule,
                MatTooltipModule,
                MatSelectModule
            ],
            declarations: [
                SettingFormFieldComponent,
                ErrorDisplayComponent,
                InfoMessageComponent,
            ],
            providers: [
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SettingFormFieldComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.get(UtilService);
        
        utilStub.getPropertyValue.and.callFake((entity, propertyIRI) => {
            return get(entity, '[\'' + propertyIRI + '\'][0][\'@value\']', '');
        });

        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            return get(entity, '[\'' + propertyIRI + '\'][0][\'@id\']', '');
        });

        formGroup = new FormGroup({
            [SETTING + 'hasDataValue']: new FormControl('firstVal')
        });

        field = SettingConstants.HAS_DATA_VALUE;

        shaclShape = {
            '@id': SETTING + 'SomeSimpleTextPreferencePropertyShape',
            '@type': [ SHACL + 'PropertyShape' ],
            [SETTING + 'usesFormField']: [ {
              '@id': SETTING + 'TextInput'
            } ],
            [SHACL + 'datatype']: [ {
              '@id': XSD + 'string'
            } ],
            [SHACL + 'name']: [ {
              '@value': 'Some simple text field'
            } ],
            [SHACL + 'maxCount']: [ {
              '@type': XSD + 'integer',
              '@value': '2'
            } ],
            [SHACL + 'minCount']: [ {
              '@type': XSD + 'integer',
              '@value': '1'
            } ],
            [SHACL + 'path']: [ {
              '@id': SETTING + 'hasDataValue'
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
                    delete component.shaclShape[SHACL + 'name'];
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
                    component.shaclShape[SETTING + 'usesFormField'] = [{
                        '@id': SETTING + 'ToggleInput'
                    }];
                    component.ngOnChanges();
                    expect(component.formType).toEqual('toggle');
                });
                it('when rdf declares an unsupported input field', function() {
                    component.shaclShape[SETTING + 'usesFormField'] = [{
                        '@id': SETTING + 'UnknownInput'
                    }];
                    component.ngOnChanges();
                    expect(component.formType).toEqual('');
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
                });
                it('when rdf declares no input field', function() {
                    delete component.shaclShape[SETTING + 'usesFormField'];
                    component.ngOnChanges();
                    expect(component.formType).toEqual('');
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
                });
            });
            describe('should set validators correctly', function() {
                it('when a min count exists', function() {
                    component.shaclShape[SHACL + 'pattern'] = [{
                        '@value': '[a-zA-Z ]*'
                    }];
                    component.ngOnChanges();
                    component.fieldFormControl.setValue('');
                    expect(component.fieldFormControl.valid).toEqual(false);
                });
                it('when a min count does not exist', function() {
                    delete component.shaclShape[SHACL + 'minCount'];
                    component.ngOnChanges();
                    component.fieldFormControl.setValue('');
                    expect(component.fieldFormControl.valid).toEqual(true);
                });
                it('when a shacl pattern exists', function() {
                    component.shaclShape[SHACL + 'pattern'] = [{
                        '@value': '[a-zA-Z ]*'
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
                    component.shaclShape[SHACL + 'datatype'] = [{
                        '@id': XSD + 'integer'
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
            expect(element.queryAll(By.css('.text-input-field')).length).toEqual(0);
        });
        it('when the formType is text input', function() {
            component.formType = 'textInput';
            component.label = 'Text field label';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.toggle-field')).length).toEqual(0);
            expect(element.queryAll(By.css('.text-input-field')).length).toEqual(1);
        });
    });
});
