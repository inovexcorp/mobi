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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { Difference } from '../../../shared/models/difference.class';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingOntologyInfo } from '../../../shared/models/mappingOntologyInfo.interface';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { ClassSelectComponent } from './classSelect.component';

describe('Class Select component', function() {
    let component: ClassSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassSelectComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let spinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    let mappingStub: jasmine.SpyObj<Mapping>;
    const ontInfo: MappingOntologyInfo = {
        recordId: 'recordId',
        branchId: 'branchId',
        commitId: 'commitId'
    };
    const mappingClass: MappingClass = {
        iri: 'mappingClass',
        name: 'Name',
        description: '',
        deprecated: false,
    };
    const mappingClassA: MappingClass = {
        iri: 'A',
        name: 'A',
        description: '',
        deprecated: false,
    };
    const mappingClassB: MappingClass = {
        iri: 'B',
        name: 'B',
        description: '',
        deprecated: false,
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatAutocompleteModule,
            ],
            declarations: [
                ClassSelectComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(InfoMessageComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(ProgressSpinnerService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ClassSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        spinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        mapperStateStub.iriMap = {
            classes: {
                [mappingClass.iri]: 'ontologyA',
                [mappingClassA.iri]: 'ontologyA',
                [mappingClassB.iri]: 'ontologyB'
            },
            dataProperties: {},
            objectProperties: {},
            annotationProperties: {}
        };
        mappingStub = jasmine.createSpyObj('Mapping', [
            'getSourceOntologyInfo',
        ]);
        mappingStub.getSourceOntologyInfo.and.returnValue(ontInfo);
        mapperStateStub.selected = {
            mapping: mappingStub,
            difference: new Difference()
        };

        component.parentForm = new UntypedFormGroup({
            class: new UntypedFormControl('')
        });
        spyOn(component.selectedClassChange, 'emit');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        spinnerStub = null;
        mapperStateStub = null;
    });

    describe('controller methods', function() {
        it('should get the display text for a class', function() {
            expect(component.getDisplayText(mappingClass)).toEqual(mappingClass.name);
            expect(component.getDisplayText(undefined)).toEqual('');
        });
        it('should select a class', function() {
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: mappingClass
                }
            } as MatAutocompleteSelectedEvent;
            component.selectClass(event);
            expect(component.selectedClass).toEqual(mappingClass);
            expect(component.selectedClassChange.emit).toHaveBeenCalledWith(mappingClass);
        });
        describe('should correctly filter the classes list', function() {
            it('unless an error occurs', async function() {
                mapperStateStub.retrieveClasses.and.returnValue(throwError('Error'));
                await component.filter('').subscribe(results => {
                    expect(results).toEqual([]);
                    expect(component.error).toEqual('Error');
                    expect(component.noResults).toBeTrue();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveClasses).toHaveBeenCalledWith(ontInfo, '', 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.classSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.classSelectSpinner);
            });
            it('with no value', async function() {
                mapperStateStub.retrieveClasses.and.returnValue(of([mappingClass, mappingClassA, mappingClassB]));
                await component.filter('').subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: 'ontologyA', classes: [mappingClassA, mappingClass] },
                        { ontologyId: 'ontologyB', classes: [mappingClassB] }
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveClasses).toHaveBeenCalledWith(ontInfo, '', 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.classSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.classSelectSpinner);
            });
            it('with a text value with one result', async function() {
                mapperStateStub.retrieveClasses.and.returnValue(of([mappingClass]));
                await component.filter(mappingClass.name).subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: 'ontologyA', classes: [mappingClass] },
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveClasses).toHaveBeenCalledWith(ontInfo, mappingClass.name, 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.classSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.classSelectSpinner);
            });
            it('with a text value with multiple results', async function() {
                mapperStateStub.retrieveClasses.and.returnValue(of([mappingClass, mappingClassA]));
                await component.filter('a').subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: 'ontologyA', classes: [mappingClassA, mappingClass] },
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveClasses).toHaveBeenCalledWith(ontInfo, 'a', 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.classSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.classSelectSpinner);
            });
            it('with an object value', async function() {
                await component.filter(mappingClass).subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: 'ontologyA', classes: [mappingClass] },
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveClasses).not.toHaveBeenCalled();
                expect(spinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
                expect(spinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.class-select')).length).toEqual(1);
        });
        ['mat-form-field', 'input[aria-label="Class"]', 'mat-autocomplete'].forEach(test => {
            it(`with a ${test}`, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
