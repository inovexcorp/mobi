/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import { By } from '@angular/platform-browser';
import { Component, DebugElement, Input } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { configureTestSuite } from "ng-bullet";

import {
    mockProvManager,
    mockUtil,
    mockPrefixes,
    mockHttpService,
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { SharedModule } from "../../../shared/shared.module";
import { ActivityCardComponent } from "./activityCard.component";

// Mocks
@Component({
    selector: 'activity-title',
    template: ''
})
class ActivityTitleComponentMock {
    @Input() activity;
    @Input() entities;
}

// Test
describe('Activity Card component', () => {
    let component: ActivityCardComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ActivityCardComponent>;
    let provManagerStub;
    let utilStub;
    let prefixesStub;
    let httpStub;


    let headers = {
        'x-total-count': 2,
    };
    let response = {
        data: {
            activities: [{'@id': 'activity1'}, {'@id': 'activity2'}],
            entities: [{'@id': 'entity1'}]
        },
        headers: jasmine.createSpy('headers').and.returnValue(headers)
    };

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ActivityCardComponent,
                ActivityTitleComponentMock
            ],
            providers: [
                { provide: 'provManagerService', useClass: mockProvManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'httpService', useClass: mockHttpService }
            ],
        });
    });

    beforeEach(fakeAsync(() => {
        fixture = TestBed.createComponent(ActivityCardComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        provManagerStub = TestBed.get('provManagerService');
        utilStub = TestBed.get('utilService');
        prefixesStub = TestBed.get('prefixes');
        httpStub = TestBed.get('httpService');
    }));

    afterAll(() => {
        cleanStylesFromDOM();
    });
    
    describe('should initialize with the correct data', () => {
        it('unless an error occurs', fakeAsync(() => {
            provManagerStub.getActivities.and.returnValue(Promise.reject('Error message'));
            component.ngOnInit();
            tick();
            expect(httpStub.cancel).toHaveBeenCalledWith(component.id);
            expect(provManagerStub.getActivities).toHaveBeenCalled();
            expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit}, component.id);
            expect(component.activities).toEqual([]);
            expect(component.entities).toEqual([]);
            expect(component.totalSize).toEqual(0);
            expect(component.limit).toEqual(10);
            expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
        }));
        it('successfully', fakeAsync(() => {
            provManagerStub.getActivities.and.returnValue(Promise.resolve(response));
            component.ngOnInit();
            tick();
            expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit}, component.id);
            expect(component.activities).toEqual(response.data.activities);
            expect(component.entities).toEqual(response.data.entities);
            expect(component.totalSize).toEqual(headers['x-total-count']);
            expect(component.limit).toEqual(10);
            expect(utilStub.createErrorToast).not.toHaveBeenCalled();
        }));
    });
    describe('controller methods', () => {
        describe('should set the page of Activities', () => {
            it('successfully', fakeAsync(() => {
                provManagerStub.getActivities.and.returnValue(Promise.resolve(response));
                component.setPage();
                tick();
                expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit}, component.id);
                expect(component.activities).toEqual(response.data.activities);
                expect(component.entities).toEqual(response.data.entities);
                expect(component.totalSize).toEqual(headers['x-total-count']);
            }));
            it('unless an error occurs', fakeAsync(() => {
                provManagerStub.getActivities.and.returnValue(Promise.reject('Error message'));
                component.setPage();
                tick();
                expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit}, component.id);
            }));
        });
        it('should load more activities', () => {
            let limit = component.limit;
            spyOn(component, 'setPage');
            component.loadMore();
            expect(component.limit).toEqual(limit + 10);
            expect(component.setPage).toHaveBeenCalled();
        });
        it('should get the time stamp of an Activity', () => {
            utilStub.getPropertyValue.and.returnValue('2017-01-01T00:00:00');
            utilStub.getDate.and.returnValue('date');
            expect(component.getTimeStamp({})).toEqual('date');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith({}, prefixesStub.prov + 'endedAtTime');
            expect(utilStub.getDate).toHaveBeenCalledWith('2017-01-01T00:00:00', 'short');
        });
    });
    describe('contains the correct html', () => {
        it('for wrapping containers', () => {
            expect(element.queryAll(By.css('.activity-card')).length).toEqual(1);
            expect(element.queryAll(By.css('.card')).length).toEqual(1);
            expect(element.queryAll(By.css('.card-header')).length).toEqual(1);
            expect(element.queryAll(By.css('.card-body')).length).toEqual(1);
        });
        it('with a .card-header-tabs', () => {
            expect(element.queryAll(By.css('.card-header-tabs')).length).toEqual(1);
        });
        it('with a .nav-item', () => {
            expect(element.queryAll(By.css('.card-header-tabs .nav-item')).length).toEqual(1);
        });
        it('depending on how many activities there are', () => {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.activity')).length).toEqual(component.activities.length);
            expect(element.queryAll(By.css('.btn')).length).toEqual(0);

            component.totalSize = 10;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.activity')).length).toEqual(component.activities.length);
            expect(element.queryAll(By.css('.btn')).length).toEqual(1);
        });
    });
});