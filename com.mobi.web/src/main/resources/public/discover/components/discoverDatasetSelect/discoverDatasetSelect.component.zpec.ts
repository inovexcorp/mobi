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
import { MockComponent, MockDirective, MockProvider } from 'ng-mocks';

import { 
    cleanStylesFromDOM
 } from '../../../../../../test/ts/Shared';
import { DiscoverStateService } from '../../../shared/services/discoverState.service';
import { SharedModule } from '../../../shared/shared.module';
import { DiscoverDatasetSelectComponent } from './discoverDatasetSelect.component';

describe('Dataset Form Group Component', function() {
    let component: DiscoverDatasetSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DiscoverDatasetSelectComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                DiscoverDatasetSelectComponent,
            ],
            providers: [
                MockProvider(DiscoverStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(DiscoverDatasetSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.get(DiscoverStateService);
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

    // === ANGULARJS 

    // beforeEach(function() {
    //     angular.mock.module('discover');
    //     mockComponent('discover', 'datasetSelect');

    //     inject(function(_$compile_, _$rootScope_) {
    //         $compile = _$compile_;
    //         scope = _$rootScope_;
    //     });

    //     scope.bindModel = '';
    //     scope.changeEvent = jasmine.createSpy('changeEvent');
    //     this.element = $compile(angular.element('<dataset-form-group bindModel="bindModel" change-event="changeEvent(value)"></dataset-form-group>'))(scope);
    //     // fixture.detectChanges(); // scope.$digest();
    //     this.controller = this.element.controller('datasetFormGroup');
    // });

    // afterEach(function() {
    //     $compile = null;
    //     scope = null;
    //     this.element.remove();
    // });

    // describe('controller bound variable', function() {
    //     it('bindModel should be one way bound', function() {
    //         component.bindModel = 'Test';
    //         // fixture.detectChanges(); // scope.$digest();
    //         expect(scope.bindModel).toEqual('');
    //     });
    //     it('changeEvent should be called in the parent scope', function() {
    //         component.changeEvent({value: 'Test'});
    //         expect(scope.changeEvent).toHaveBeenCalledWith('Test');
    //     });
    // });
    // describe('contains the correct html', function() {
    //     it('for wrapping containers', function() {
    //         expect(this.element.prop('tagName')).toBe('DATASET-FORM-GROUP');
    //     });
    //     it('with a custom-label', function() {
    //         expect(element.queryAll(By.css('custom-label').length).toBe(1);
    //     });
    //     it('with a dataset-select', function() {
    //         expect(element.queryAll(By.css('dataset-select').length).toBe(1);
    //     });
    //     it('with a .btn-clear', function() {
    //         expect(element.queryAll(By.css('.btn-clear').length).toBe(1);
    //     });
    // });
    // describe('controller methods', function() {
    //     it('clear should clear the proper value', function() {
    //         component.bindModel = 'test';
    //         component.clear();
    //         expect(component.bindModel).toBe('');
    //         // fixture.detectChanges(); // scope.$digest();
    //         expect(scope.changeEvent).toHaveBeenCalledWith('');
    //         expect(scope.bindModel).toBe('');
    //     });
    //     it('onChange should call the correct methods', function() {
    //         component.onChange('value');
    //         expect(component.bindModel).toEqual('value');
    //         expect(scope.changeEvent).toHaveBeenCalledWith(component.bindModel);
    //     });
    // });

});
