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
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { DCTERMS } from '../../../prefixes';
import { BranchSelectComponent } from './branchSelect.component';

describe('Branch Select component', function() {
    let component: BranchSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<BranchSelectComponent>;
    let jsonld;
    let display;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatFormFieldModule,
                MatAutocompleteModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatIconModule
            ],
            declarations: [
                BranchSelectComponent
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BranchSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        jsonld = {
            '@id': 'thing',
            '@type': [],
            [`${DCTERMS}title`]: [{ '@value': 'title' }]
        };
        display = { branch: jsonld, title: 'title' };

        component.model = jsonld;
        component.branches = [];
        component.required = true;
        component.isDisabledWhen = false;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize with the correct value for', function() {
        it('model', function() {
            expect(component.model).toEqual(jsonld);
        });
        it('branches', function() {
            expect(component.branches).toEqual([]);
        });
        it('required', function() {
            expect(component.required).toBeTrue();
        });
        it('isDisabledWhen', function() {
            expect(component.isDisabledWhen).toBeFalse();
        });
    });
    describe('controller methods', function() {
        it('should emit when a branch is selected', function() {
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: display
                }
            } as MatAutocompleteSelectedEvent;
            spyOn(component.modelChange, 'emit');
            component.selectedBranch(event);
            expect(component.modelChange.emit).toHaveBeenCalledWith(jsonld);
        });
        describe('should return title', function() {
            it('as an empty string', function() {
                expect(component.getDisplayText(undefined)).toEqual('');
            });
            it('with a value', function() {
                expect(component.getDisplayText(display)).toEqual('title');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.branch-select')).length).toEqual(1);
        });
        it('with an input for filtering', function() {
            const input = element.queryAll(By.css('input'));
            expect(input.length).toEqual(1);
        });
        it('with a mat-autocomplete', function() {
            expect(element.queryAll(By.css('mat-autocomplete')).length).toEqual(1);
        });
    });
});
