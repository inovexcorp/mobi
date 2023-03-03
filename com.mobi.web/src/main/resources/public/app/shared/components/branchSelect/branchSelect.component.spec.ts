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
import { BranchSelectComponent } from './branchSelect.component';
import { UtilService } from '../../services/util.service';
import { MockProvider } from 'ng-mocks';

describe('Branch Select component', function() {
    let component: BranchSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<BranchSelectComponent>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let jsonld;

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
            ],
            providers: [
                MockProvider(UtilService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BranchSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        jsonld = {'@id': 'thing', '@type': []};

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
        utilStub = null;
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
                    value: jsonld
                }
            } as MatAutocompleteSelectedEvent;
            spyOn(component.modelChange, 'emit');
            component.selectedBranch(event);
            expect(component.modelChange.emit).toHaveBeenCalledWith(jsonld);
        });
        describe('should return title', function() {
            it('as an empty string', function() {
                expect(component.getDisplayText(undefined)).toEqual('');
                expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
            });
            it('with a value', function() {
                utilStub.getDctermsValue.and.returnValue('value');
                expect(component.getDisplayText(jsonld)).toEqual('value');
                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(jsonld, 'title');
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
