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
import { MockProvider, MockPipe } from 'ng-mocks';

import {
    cleanStylesFromDOM,
    mockOntologyManager,
    mockUtil,
} from '../../../../../../test/ts/Shared';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { PropPreviewComponent } from './propPreview.component';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';

describe('Prop Preview component', function() {
    let component: PropPreviewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PropPreviewComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let splitIRIStub: jasmine.SpyObj<SplitIRIPipe>;
    let ontologyManagerStub;
    let utilStub;
    
    const classId = 'classId';
    const propId = 'propId';
    const range = 'range';
    const propObj = {
        '@id': propId
    };
    const mappingClass: MappingClass = {
        classObj: {'@id': classId},
        name: 'Name',
        isDeprecated: true,
        ontologyId: ''
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                PropPreviewComponent,
            ],
            providers: [
                MockProvider(MapperStateService),
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
                { provide: 'utilService', useClass: mockUtil },
                { provide: OntologyManagerService, useClass: mockOntologyManager }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PropPreviewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.get(MapperStateService);
        splitIRIStub = TestBed.get(SplitIRIPipe);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        utilStub = TestBed.get('utilService');

        mapperStateStub.availableClasses = [mappingClass];
        ontologyManagerStub.getEntityName.and.returnValue('Name');
        ontologyManagerStub.getEntityDescription.and.returnValue('Description');
        utilStub.getPropertyId.and.returnValue(classId);
        splitIRIStub.transform.and.returnValue({
            begin: '',
            then: '',
            end: range
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
        splitIRIStub = null;
        ontologyManagerStub = null;
        utilStub = null;
    });

    describe('should set the correct variables when the propObj changes', function() {
        it('if it is a data property', function() {
            ontologyManagerStub.isObjectProperty.and.returnValue(false);
            component.propObj = propObj;
            expect(ontologyManagerStub.getEntityName).toHaveBeenCalledWith(propObj);
            expect(ontologyManagerStub.getEntityDescription).toHaveBeenCalledWith(propObj);
            expect(component.name).toEqual('Name');
            expect(component.description).toEqual('Description');
            expect(component.rangeName).toEqual(range);
            expect(splitIRIStub.transform).toHaveBeenCalledWith(classId);
            expect(component.rangeIsDeprecated).toBeFalse();
            expect(component.rangeId).toEqual(classId);
        });
        describe('if it is an object property', function() {
            beforeEach(function() {
                ontologyManagerStub.isObjectProperty.and.returnValue(true);
            });
            it('and the range exists', function() {
                component.propObj = propObj;
                expect(ontologyManagerStub.getEntityName).toHaveBeenCalledWith(propObj);
                expect(ontologyManagerStub.getEntityDescription).toHaveBeenCalledWith(propObj);
                expect(component.name).toEqual('Name');
                expect(component.description).toEqual('Description');
                expect(component.rangeName).toEqual(mappingClass.name);
                expect(component.rangeIsDeprecated).toBeTrue();
                expect(component.rangeId).toEqual(classId);
                expect(splitIRIStub.transform).not.toHaveBeenCalled();
            });
            it('and the range does not exist', function() {
                mapperStateStub.availableClasses = [];
                component.propObj = propObj;
                expect(ontologyManagerStub.getEntityName).toHaveBeenCalledWith(propObj);
                expect(ontologyManagerStub.getEntityDescription).toHaveBeenCalledWith(propObj);
                expect(component.name).toEqual('Name');
                expect(component.description).toEqual('Description');
                expect(component.rangeName).toEqual('(No range)');
                expect(component.rangeIsDeprecated).toBeFalse();
                expect(component.rangeId).toEqual(classId);
                expect(splitIRIStub.transform).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.prop-preview')).length).toEqual(1);
        });
        it('depending on whether the range class is deprecated', function() {
            expect(element.queryAll(By.css('.deprecated')).length).toEqual(0);

            component.rangeIsDeprecated = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.deprecated')).length).toEqual(1);
        });
    });
});
