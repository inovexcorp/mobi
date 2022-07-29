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
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM,
    mockUtil,
} from '../../../../../../test/ts/Shared';
import { DELIM } from '../../../prefixes';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { MappingPreviewComponent } from './mappingPreview.component';

describe('Mapping Preview component', function() {
    let component: MappingPreviewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MappingPreviewComponent>;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
    let utilStub;

    const classMappingA = {'@id': 'classMappingA'};
    const classMappingB = {'@id': 'classMappingB'};
    const propMappingA = {'@id': 'propMappingA'};
    const propMappingB = {'@id': 'propMappingB'};
    let mappingStub: jasmine.SpyObj<Mapping>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                MappingPreviewComponent,
            ],
            providers: [
                MockProvider(MappingManagerService),
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MappingPreviewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mappingManagerStub = TestBed.get(MappingManagerService);
        utilStub = TestBed.get('utilService');

        mappingStub = jasmine.createSpyObj('Mapping', [
            'getClassMapping',
            'getAllClassMappings',
            'getPropMappingsByClass'
        ]);
        mappingStub.getAllClassMappings.and.returnValue([classMappingB, classMappingA]);
        mappingStub.getPropMappingsByClass.and.returnValue([propMappingB, propMappingA]);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mappingManagerStub = null;
        utilStub = null;
    });

    it('should correctly handle changes to the mapping', function() {
        spyOn(component, 'setClassMappings');
        component.mapping = mappingStub;
        expect(component.setClassMappings).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        it('should create the IRI template for the class mapping', function() {
            utilStub.getPropertyValue.and.callFake((obj, prop) => {
                if (prop === DELIM + 'hasPrefix') {
                    return 'prefix:';
                } else {
                    return 'localName';
                }
            });
            expect(component.getIriTemplate(classMappingA)).toEqual('prefix:localName');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMappingA, DELIM + 'hasPrefix');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMappingA, DELIM + 'localName');
        });
        describe('should get the value of a property mapping', function() {
            it('if it is data property', function() {
                mappingManagerStub.isDataMapping.and.returnValue(true);
                utilStub.getPropertyValue.and.returnValue('0');
                expect(component.getPropValue(propMappingA)).toEqual('0');
                expect(utilStub.getPropertyValue).toHaveBeenCalledWith(propMappingA, DELIM + 'columnIndex');
            });
            it('if is an object property', function() {
                spyOn(component, 'setClassMappings');
                mappingManagerStub.isDataMapping.and.returnValue(false);
                utilStub.getDctermsValue.and.returnValue('Class');
                utilStub.getPropertyId.and.returnValue('classMapping');
                mappingStub.getClassMapping.and.returnValue(classMappingA);
                component.mapping = mappingStub;
                expect(component.getPropValue(propMappingA)).toEqual('Class');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(propMappingA, DELIM + 'classMapping');
                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(classMappingA, 'title');
            });
        });
        it('should test whether a property mapping is invalid', function() {
            component.invalidProps = [];
            expect(component.isInvalid('')).toEqual(false);
            component.invalidProps = [{id: '', index: 0}];
            expect(component.isInvalid('')).toEqual(true);
        });
        it('should correctly update variables when the mapping changes', function() {
            spyOn(component, 'getIriTemplate').and.returnValue('IRI Template');
            spyOn(component, 'getPropValue').and.returnValue('Prop Value');
            spyOn(component, 'isInvalid').and.returnValue(false);
            utilStub.getDctermsValue.and.callFake(obj => obj['@id']);
            component.mapping = mappingStub;
            expect(component.classMappings.length).toEqual(2);
            expect(component.classMappings[0].id).toEqual(classMappingA['@id']);
            component.classMappings.forEach(classMapping => {
                expect(classMapping.title).toEqual(classMapping.id);
                expect(classMapping.iriTemplate).toEqual('IRI Template');
                expect(classMapping.propMappings.length).toEqual(2);
                expect(classMapping.propMappings[0].id).toEqual(propMappingA['@id']);
                classMapping.propMappings.forEach(propMapping => {
                    expect(propMapping.title).toEqual(propMapping.id);
                    expect(propMapping.value).toEqual('Prop Value');
                    expect(propMapping.isInvalid).toEqual(false);
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.mapping-preview')).length).toEqual(1);
        });
        it('with all class and property mappings displayed', function() {
            component.mapping = mappingStub;
            fixture.detectChanges();
            const classListItems = element.queryAll(By.css('.list > li'));
            expect(classListItems.length).toEqual(2);
            classListItems.forEach(item => {
                expect(item.queryAll(By.css('.props > li')).length).toEqual(2);
            });
        });
        it('depending on whether a property mapping is valid', function() {
            spyOn(component, 'isInvalid').and.returnValue(true);
            component.mapping = mappingStub;
            fixture.detectChanges();
            const propItem = element.queryAll(By.css('.props > li'))[0];
            expect(propItem).toBeDefined();
            expect(propItem.classes['text-danger']).toEqual(true);
            expect(propItem.classes['font-weight-bold']).toEqual(true);
        });
    });
});
