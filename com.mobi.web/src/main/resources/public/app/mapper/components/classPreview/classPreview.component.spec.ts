/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OWL } from '../../../prefixes';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingOntologyInfo } from '../../../shared/models/mappingOntologyInfo.interface';
import { Difference } from '../../../shared/models/difference.class';
import { ClassPreviewComponent } from './classPreview.component';

describe('Class Preview component', function() {
    let component: ClassPreviewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassPreviewComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;

    const ontInfo: MappingOntologyInfo = {
        recordId: 'recordId',
        branchId: 'branchId',
        commitId: 'commitId'
    };
    let mappingStub: jasmine.SpyObj<Mapping>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ClassPreviewComponent,
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(OntologyManagerService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ClassPreviewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        mappingStub = jasmine.createSpyObj('Mapping', [
            'getSourceOntologyInfo',
        ]);
        mappingStub.getSourceOntologyInfo.and.returnValue(ontInfo);
        mapperStateStub.selected = {
            mapping: mappingStub,
            difference: new Difference()
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
        mappingStub = null;
    });

    describe('should set the correct variables when the classObj changes', function() {
        it('successfully', fakeAsync(function() {
          const props: MappingProperty[] = [...Array(11).keys()].map(idx => ({
              iri: `${idx}`,
              name: `${idx}`,
              type: `${OWL}DatatypeProperty`,
              deprecated: false,
              description: '',
              ranges: []
          }));
          mapperStateStub.retrieveProps.and.returnValue(of(props));
          component.classDetails = { iri: 'class', name: 'Name', description: 'Description', deprecated: false };
          tick();
          expect(component.name).toEqual('Name');
          expect(component.description).toEqual('Description');
          expect(mapperStateStub.retrieveProps).toHaveBeenCalledWith(ontInfo, component.classDetails.iri, '', 10);
          expect(component.props).toEqual(props);
        }));
        it('even if the properties could not be retrieved', fakeAsync(function() {
            mapperStateStub.retrieveProps.and.returnValue(throwError('Error'));
            component.classDetails = { iri: 'class', name: 'Name', description: 'Description', deprecated: false };
            tick();
            expect(component.name).toEqual('Name');
            expect(component.description).toEqual('Description');
            expect(mapperStateStub.retrieveProps).toHaveBeenCalledWith(ontInfo, component.classDetails.iri, '', 10);
            expect(component.props).toEqual([]);
        }));
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
                iri: 'id',
                type: `${OWL}DatatypeProperty`,
                name: 'name',
                deprecated: false,
                description: '',
                ranges: []
            }];
            fixture.detectChanges();
            expect(propList.nativeElement.innerHTML).not.toContain('None');
            expect(element.queryAll(By.css('li')).length).toBeGreaterThan(0);
        });
        it('depending on whether a property is deprecated', function() {
            component.props = [{
                iri: 'id',
                type: `${OWL}DatatypeProperty`,
                name: 'name',
                deprecated: true,
                description: '',
                ranges: []
            }];
            fixture.detectChanges();
            expect(element.queryAll(By.css('ul li span.deprecated')).length).toEqual(1);
        });
    });
});
