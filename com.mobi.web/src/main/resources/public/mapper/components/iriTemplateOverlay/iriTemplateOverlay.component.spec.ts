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
import { MatDialogRef } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { DELIM } from '../../../prefixes';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { SharedModule } from '../../../shared/shared.module';
import { IriTemplateOverlayComponent } from './iriTemplateOverlay.component';

describe('IRI Template Overlay component', function() {
    let component: IriTemplateOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<IriTemplateOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<IriTemplateOverlayComponent>>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const begin = 'http://test';
    const then = '/';
    const localName = '${0}';
    const classMappingId = 'classMappingId';
    const classMapping: JSONLDObject = {
        '@id': classMappingId,
        hasPrefix: begin + then,
        localName: localName
    };
    let mappingStub: jasmine.SpyObj<Mapping>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                SharedModule
            ],
            declarations: [
                IriTemplateOverlayComponent,
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(MappingManagerService),
                MockProvider(DelimitedManagerService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(IriTemplateOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.get(MapperStateService);
        mappingManagerStub = TestBed.get(MappingManagerService);
        delimitedManagerStub = TestBed.get(DelimitedManagerService);
        matDialogRef = TestBed.get(MatDialogRef);
        utilStub = TestBed.get(UtilService);

        mapperStateStub.selectedClassMappingId = 'classMapping';
        mappingStub = jasmine.createSpyObj('Mapping', [
            'getClassMapping'
        ]);
        mappingStub.getClassMapping.and.returnValue(classMapping);
        utilStub.getPropertyValue.and.callFake((entity, iri) => {
            if (iri === DELIM + 'hasPrefix') {
                return classMapping.hasPrefix;
            } else if (iri === DELIM + 'localName') {
                return classMapping.localName;
            }
        });
        mapperStateStub.selectedClassMappingId = classMappingId;
        mapperStateStub.selected = {
            difference: new Difference(),
            mapping: mappingStub
        };
        delimitedManagerStub.dataRows = [['Header']];
        delimitedManagerStub.getHeader.and.returnValue('Header');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mapperStateStub = null;
        mappingManagerStub = null;
        delimitedManagerStub = null;
        utilStub = null;
        mappingStub = null;
    });

    describe('should initialize with the correct values', function() {
        it('if a column is already selected', function() {
            component.ngOnInit();
            expect(mappingStub.getClassMapping).toHaveBeenCalledWith(classMappingId);
            expect(component.classMapping).toEqual(classMapping);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMapping, DELIM + 'hasPrefix');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMapping, DELIM + 'localName');
            expect(component.iriTemplateForm.controls.beginsWith.value).toEqual(begin);
            expect(component.iriTemplateForm.controls.then.value).toEqual(then);
            expect(component.localNameOptions.length).toEqual(2);
            expect(component.localNameOptions).toContain(component.uuidOption);
            expect(component.localNameOptions).toContain({ text: 'Header', value: '${0}'});
            expect(component.iriTemplateForm.controls.endsWith.value).toEqual('${0}');
        });
        it('if a column is not already selected', function() {
            utilStub.getPropertyValue.and.returnValue(classMapping.hasPrefix);
            component.ngOnInit();
            expect(mappingStub.getClassMapping).toHaveBeenCalledWith(classMappingId);
            expect(component.classMapping).toEqual(classMapping);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMapping, DELIM + 'hasPrefix');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMapping, DELIM + 'localName');
            expect(component.iriTemplateForm.controls.beginsWith.value).toEqual(begin);
            expect(component.iriTemplateForm.controls.then.value).toEqual(then);
            expect(component.localNameOptions.length).toEqual(2);
            expect(component.localNameOptions).toContain(component.uuidOption);
            expect(component.localNameOptions).toContain({ text: 'Header', value: '${0}'});
            expect(component.iriTemplateForm.controls.endsWith.value).toEqual(component.uuidOption.value);
        });
        it('with correct form validators', function() {
            const failTests = ['/', '#', '?', 'test/', '/test', 'test#', '#test', 'test?', '?test', 't: test', 'test#test', 'test?test', 'test/test'];
            const successTests = ['t:test', 'test:/test', 'TEST:test', 't:test.test'];
            component.iriTemplateForm.controls.beginsWith.setValue('');
            component.iriTemplateForm.updateValueAndValidity();
            expect(component.iriTemplateForm.controls.beginsWith.invalid).toBeTrue();

            failTests.forEach(test => {
                component.iriTemplateForm.controls.beginsWith.setValue(test);
                component.iriTemplateForm.updateValueAndValidity();
                expect(component.iriTemplateForm.controls.beginsWith.invalid).toBeTrue();
            });
            successTests.forEach(test => {
                component.iriTemplateForm.controls.beginsWith.setValue(test);
                component.iriTemplateForm.updateValueAndValidity();
                expect(component.iriTemplateForm.controls.beginsWith.invalid).toBeFalse();
            });
        });
    });
    describe('controller methods', function() {
        it('should correctly set the iri template', function() {
            component.iriTemplateForm.controls.beginsWith.setValue('new');
            component.iriTemplateForm.controls.then.setValue('#');
            component.iriTemplateForm.controls.endsWith.setValue(component.uuidOption.value);
            component.classMapping = classMapping;
            component.set();
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMapping, DELIM + 'hasPrefix');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMapping, DELIM + 'localName');
            expect(mappingManagerStub.editIriTemplate).toHaveBeenCalledWith(mappingStub, classMappingId, 'new#', component.uuidOption.value);
            expect(mapperStateStub.changeProp).toHaveBeenCalledWith(classMappingId, DELIM + 'hasPrefix', 'new#', begin + then);
            expect(mapperStateStub.changeProp).toHaveBeenCalledWith(classMappingId, DELIM + 'localName', component.uuidOption.value, localName);
            expect(matDialogRef.close).toHaveBeenCalledWith();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with mat-form-fields', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(3);
        });
        ['input[name="beginsWith"]', 'mat-select[name="then"]', 'mat-select[name="endsWith"]'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('depending on the validity of the form', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.iriTemplateForm.controls.beginsWith.setValue('');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        const button = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        button.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call set when the button is clicked', function() {
        component.ngOnInit();
        spyOn(component, 'set');
        const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.set).toHaveBeenCalledWith();
    });
});
