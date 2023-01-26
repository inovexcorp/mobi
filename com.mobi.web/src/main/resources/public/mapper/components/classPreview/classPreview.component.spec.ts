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
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { ClassPreviewComponent } from './classPreview.component';

describe('Class Preview component', function() {
    let component: ClassPreviewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassPreviewComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                ClassPreviewComponent,
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(OntologyManagerService),
                // { provide: OntologyManagerService, useClass: mockOntologyManager }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassPreviewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.get(MapperStateService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
        ontologyManagerStub = null;
    });

    it('should set the correct variables when the classObj changes', function() {
        const props: MappingProperty[] = [...Array(11).keys()].map(idx => ({
            propObj: {'@id': '' + idx},
            name: '' + idx,
            isDeprecated: false,
            isObjectProperty: false,
            ontologyId: ''
        }));
        mapperStateStub.getClassProps.and.returnValue(props);
        ontologyManagerStub.getEntityName.and.returnValue('Name');
        ontologyManagerStub.getEntityDescription.and.returnValue('Description');
        component.classObj = {'@id': 'class'};
        expect(ontologyManagerStub.getEntityName).toHaveBeenCalledWith(component.classObj);
        expect(ontologyManagerStub.getEntityDescription).toHaveBeenCalledWith(component.classObj);
        expect(component.name).toEqual('Name');
        expect(component.description).toEqual('Description');
        expect(mapperStateStub.getClassProps).toHaveBeenCalledWith(component.ontologies, component.classObj['@id']);
        expect(component.total).toEqual(props.length);
        expect(component.props.length).toEqual(10);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.class-preview')).length).toEqual(1);
        });
        it('depending on whether classObj has any properties', function() {
            fixture.detectChanges();
            const propList = element.queryAll(By.css('ul'))[0];
            expect(propList.nativeElement.innerHTML).toContain('None');

            component.props = [{
                propObj: {'@id': 'id'},
                name: 'name',
                isDeprecated: false,
                isObjectProperty: false,
                ontologyId: ''
            }];
            fixture.detectChanges();
            expect(propList.nativeElement.innerHTML).not.toContain('None');
            expect(element.queryAll(By.css('li')).length).toBeGreaterThan(0);
        });
        it('depending on whether classObj has more than 10 properties', function() {
            component.props = [{
                propObj: {'@id': 'id'},
                name: 'name',
                isDeprecated: false,
                isObjectProperty: false,
                ontologyId: ''
            }];
            component.total = 9;
            fixture.detectChanges();
            const item = element.queryAll(By.css('ul li'))[0];
            expect(item.classes['last']).toBeTruthy();
            expect(item.classes['limited']).toBeFalsy();

            component.total = 11;
            fixture.detectChanges();
            expect(item.classes['last']).toBeTruthy();
            expect(item.classes['limited']).toBeTruthy();
        });
        it('depending on whether a property is deprecated', function() {
            component.props = [{
                propObj: {'@id': 'id'},
                name: 'name',
                isDeprecated: true,
                isObjectProperty: false,
                ontologyId: ''
            }];
            fixture.detectChanges();
            expect(element.queryAll(By.css('ul li span.deprecated')).length).toEqual(1);
        });
    });
});
