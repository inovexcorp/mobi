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
import {
    mockProvManager,
    mockUtil,
    mockPrefixes,
    mockHttpService
} from '../../../../../../test/ts/Shared';

import { By } from '@angular/platform-browser';
import {Component, DebugElement, Input, NO_ERRORS_SCHEMA} from "@angular/core";
import {ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick} from "@angular/core/testing";
import {ActivityCardComponent} from "./activityCard.component";
import {configureTestSuite} from "ng-bullet";
import {SharedModule} from "../../../shared/shared.module";
import {HomeModule} from "../../home.module";
import provManagerService from "../../../shared/services/provManager.service";
import utilService from "../../../shared/services/util.service";
import prefixes from "../../../shared/services/prefixes.service";
import httpService from "../../../shared/services/http.service";

@Component({
    selector: 'activity-title',
    template: ''
})
class ActivityTitleComponentStub {
    @Input() activity;
    @Input() entities;
}

fdescribe('Activity Card component', () => {
    let component: ActivityCardComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ActivityCardComponent>;

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

    let provManagerService;
    let utilService;
    let prefixes;
    let httpService;
    // let mockProvManagerStub = jasmine.createSpyObj('provManagerService', ['getActivities']);
    // let httpServiceStub = jasmine.createSpyObj('httpService', ['cancel']);
    // let utilStub = jasmine.createSpyObj('utilService', ['createErrorToast']);
    // let prefixesStub = jasmine.createSpyObj('prefixes', ['prov']);

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule],
            declarations: [ ActivityCardComponent, ActivityTitleComponentStub ],
            providers: [
                {provide: 'provManagerService', useClass: mockProvManager},
                {provide: 'utilService', useClass: mockUtil},
                {provide: 'prefixes', useClass: mockPrefixes},
                {provide: 'httpService', useClass: mockHttpService}
            ],
            // schemas: [ NO_ERRORS_SCHEMA ]
        });
    });

    beforeEach(fakeAsync(() => {
        fixture = TestBed.createComponent(ActivityCardComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        provManagerService = TestBed.get('provManagerService');
        utilService = TestBed.get('utilService');
        prefixes = TestBed.get('prefixes');
        httpService = TestBed.get('httpService');
        // provManagerService.getActivities.and.returnValue(Promise.resolve(response));
        // provManagerService.getActivities.and.callFake(() => Promise.reject('Error message'));
        // fixture.detectChanges();
        // component.ngOnInit();
        // httpService.cancel.and.returnValue(null);
    }));
    
    describe('should initialize with the correct data', () => {
        fit('unless an error occurs', /*fakeAsync(*/() => {
            provManagerService.getActivities.and.returnValue(Promise.reject('Error message'));
            // provManagerService.getActivities.and.callFake(() => Promise.reject('Error message'));
            // utilService.createErrorToast.and.returnValue(null);
            component.setPage();
            // tick();
            fixture.detectChanges();
            // tick();

            // component.setPage();
            // tick();
            // flushMicrotasks();

            expect(httpService.cancel).toHaveBeenCalledWith(component.id);
            expect(provManagerService.getActivities).toHaveBeenCalled();
            expect(provManagerService.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit}, component.id);
            expect(component.activities).toEqual([]);
            expect(component.entities).toEqual([]);
            expect(component.totalSize).toEqual(0);
            expect(component.limit).toEqual(10);
            expect(utilService.createErrorToast).toHaveBeenCalledWith('Error message');
        })/*)*/;
        it('successfully', /*fakeAsync(*/() => {
            // tick();
            // provManagerService.getActivities.and.returnValue(Promise.resolve(response));
            component.setActivities(response);
            // component.pm.getActivities.and.callFake(() => Promise.resolve(response));
            // component.pm.getActivities.and.returnValue(Promise.resolve(response));
            fixture.detectChanges();
            // tick();
            // flushMicrotasks();
            expect(provManagerService.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit}, component.id);
            expect(component.activities).toEqual(response.data.activities);
            expect(component.entities).toEqual(response.data.entities);
            expect(component.totalSize).toEqual(headers['x-total-count']);
            expect(component.limit).toEqual(10);
            expect(utilService.createErrorToast).not.toHaveBeenCalled();
        })/*)*/;
    });
    describe('controller methods', () => {
        beforeEach(() => {
            // fixture.detectChanges();
        });
        describe('should set the page of Activities', () => {
            it('successfully', fakeAsync(() => {
                provManagerService.getActivities.and.returnValue(Promise.resolve(response));
                component.setPage();
                tick();
                // fixture.detectChanges();
                expect(provManagerService.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit}, component.id);
                expect(component.activities).toEqual(response.data.activities);
                expect(component.entities).toEqual(response.data.entities);
                expect(component.totalSize).toEqual(headers['x-total-count']);
            }));
            it('unless an error occurs', () => {
                provManagerService.getActivities.and.returnValue(Promise.reject('Error message'));
                component.setPage();
                fixture.detectChanges();
                expect(provManagerService.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit}, component.id);
            });
        });
        it('should load more activities', () => {
            let limit = component.limit;
            spyOn(component, 'setPage');
            component.loadMore();
            expect(component.limit).toEqual(limit + 10);
            expect(component.setPage).toHaveBeenCalled();
        });
        it('should get the time stamp of an Activity', () => {
            utilService.getPropertyValue.and.returnValue('2017-01-01T00:00:00');
            utilService.getDate.and.returnValue('date');
            expect(component.getTimeStamp({})).toEqual('date');
            expect(utilService.getPropertyValue).toHaveBeenCalledWith({}, prefixes.prov + 'endedAtTime');
            expect(utilService.getDate).toHaveBeenCalledWith('2017-01-01T00:00:00', 'short');
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