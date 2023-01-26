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
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatInputModule, MatFormFieldModule, MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';

import {
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { ClassSelectComponent } from './classSelect.component';

describe('Class Select component', function() {
    let component: ClassSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassSelectComponent>;

    const mappingClass: MappingClass = {
        classObj: {'@id': 'classId'},
        isDeprecated: false,
        name: 'Class',
        ontologyId: 'ontologyA'
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.parentForm = new FormGroup({
            class: new FormControl('')
        });
        spyOn(component.selectedClassChange, 'emit');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
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
        describe('should correctly filter the classes list based on the input', function() {
            it('if there are no classes', function() {
                expect(component.filter('')).toEqual([]);
            });
            describe('if there are classes', function() {
                beforeEach(function() {
                    this.classA = {
                        classObj: {'@id': 'A'},
                        name: 'A',
                        isDeprecated: false,
                        ontologyId: 'ontologyA'
                    };
                    this.classB = {
                        classObj: {'@id': 'B'},
                        name: 'B',
                        isDeprecated: false,
                        ontologyId: 'ontologyB'
                    };
                    component.classes = [mappingClass, this.classA, this.classB];
                });
                it('and no value', function() {
                    expect(component.filter('')).toEqual([
                        {ontologyId: 'ontologyA', classes: [this.classA, mappingClass]},
                        {ontologyId: 'ontologyB', classes: [this.classB]}
                    ]);
                });
                it('and a text value with one result', function() {
                    expect(component.filter(mappingClass.name)).toEqual([
                        {ontologyId: 'ontologyA', classes: [mappingClass]},
                    ]);
                });
                it('and a text value with multiple results', function() {
                    expect(component.filter('a')).toEqual([
                        {ontologyId: 'ontologyA', classes: [this.classA, mappingClass]},
                    ]);
                });
                it('and an object value', function() {
                    expect(component.filter(mappingClass)).toEqual([
                        {ontologyId: 'ontologyA', classes: [mappingClass]},
                    ]);
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.class-select')).length).toEqual(1);
        });
        ['mat-form-field', 'input[aria-label="Class"]', 'mat-autocomplete'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
