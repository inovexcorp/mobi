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
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { PropSelectComponent } from './propSelect.component';

describe('Prop Select component', function() {
    let component: PropSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PropSelectComponent>;

    const propId = 'propId';
    const mappingProperty: MappingProperty = {
        propObj: {'@id': propId},
        name: 'Name',
        isDeprecated: false,
        isObjectProperty: false,
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
                PropSelectComponent,
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PropSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.parentForm = new FormGroup({
            class: new FormControl('')
        });
        spyOn(component.selectedPropChange, 'emit');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('controller methods', function() {
        it('should get the display text for a property', function() {
            expect(component.getDisplayText(mappingProperty)).toEqual(mappingProperty.name);
            expect(component.getDisplayText(undefined)).toEqual('');
        });
        it('should select a class', function() {
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: mappingProperty
                }
            } as MatAutocompleteSelectedEvent;
            component.selectProp(event);
            expect(component.getSelectedProp()).toEqual(mappingProperty);
            expect(component.selectedPropChange.emit).toHaveBeenCalledWith(mappingProperty);
        });
        describe('should correctly filter the property list based on the input', function() {
            it('if there are no classes', function() {
                
                expect(component.filter('')).toEqual([]);
            });
            describe('if there are classes', function() {
                beforeEach(function() {
                    this.propA = {
                        propObj: {'@id': 'A'},
                        name: 'A',
                        isDeprecated: false,
                        ontologyId: 'ontologyA'
                    };
                    this.propB = {
                        propObj: {'@id': 'B'},
                        name: 'B',
                        isDeprecated: false,
                        isObjectProperty: false,
                        ontologyId: 'ontologyB'
                    };
                    component.properties = [mappingProperty, this.propA, this.propB];
                });
                it('and no value', function() {
                    expect(component.filter('')).toEqual([
                        {ontologyId: 'ontologyA', properties: [this.propA, mappingProperty]},
                        {ontologyId: 'ontologyB', properties: [this.propB]}
                    ]);
                });
                it('and a text value with one result', function() {
                    expect(component.filter(mappingProperty.name)).toEqual([
                        {ontologyId: 'ontologyA', properties: [mappingProperty]},
                    ]);
                });
                it('and a text value with multiple results', function() {
                    expect(component.filter('a')).toEqual([
                        {ontologyId: 'ontologyA', properties: [this.propA, mappingProperty]},
                    ]);
                });
                it('and an object value', function() {
                    expect(component.filter(mappingProperty)).toEqual([
                        {ontologyId: 'ontologyA', properties: [mappingProperty]},
                    ]);
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.prop-select')).length).toEqual(1);
        });
        ['mat-form-field', 'input[aria-label="Property"]', 'mat-autocomplete'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
