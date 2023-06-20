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
import { MockComponent, MockProvider } from 'ng-mocks';

import { 
    cleanStylesFromDOM
 } from '../../../../../public/test/ts/Shared';
import { DiscoverStateService } from '../../../shared/services/discoverState.service';
import { DiscoverDatasetSelectComponent } from './discoverDatasetSelect.component';
import { DatasetSelectComponent } from '../../../shared/components/datasetSelect/datasetSelect.component';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

describe('Discover Dataset Select Component', function() {
    let component: DiscoverDatasetSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DiscoverDatasetSelectComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            // imports: [ SharedModule ],
            declarations: [
                DiscoverDatasetSelectComponent,
                MockComponent(DatasetSelectComponent)
            ],
            providers: [
                MockProvider(DiscoverStateService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DiscoverDatasetSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;

        spyOn(component.recordIdChange, 'emit');

        component.recordId = '';
        component.parentForm = new UntypedFormGroup({
            datasetSelect: new UntypedFormControl(''),
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.discover-dataset-select')).length).toEqual(1);
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            component.recordId = 'Test';
            fixture.detectChanges(); // component.$digest();
            expect(component.recordId).toEqual('Test');
        });
    });
    describe('contains the correct html', function() {
        it('with a dataset-select', function() {
            expect(element.queryAll(By.css('dataset-select')).length).toBe(1);
        });
        it('with a .btn-clear', function() {
            expect(element.queryAll(By.css('.btn-clear')).length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('clear should clear the proper value', function() {
            component.recordId = 'test';
            component.clear();
            expect(component.recordId).toBe('');
            fixture.detectChanges(); // component.$digest();
            expect(component.recordIdChange.emit).toHaveBeenCalledWith({});
            expect(component.recordId).toBe('');
        });
        it('onChange should call the correct methods', function() {
            component.onChange({'recordId': 'value', 'recordTitle': 'test'});
            expect(component.recordId).toEqual('value');
            expect(component.recordIdChange.emit).toHaveBeenCalledWith({
                'recordId': 'value', 'recordTitle': 'test'
            });
        });
    });
});
