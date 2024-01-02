/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { MockComponent, MockProvider } from 'ng-mocks';
import { throwError, of } from 'rxjs';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { ActivityTitleComponent } from '../../../shared/components/activityTitle/activityTitle.component';
import { ProvManagerService } from '../../../shared/services/provManager.service';
import { ToastService } from '../../services/toast.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { PROV } from '../../../prefixes';
import { ActivityListComponent } from './activity-list.component';

describe('ActivityListComponent', function() {
    let component: ActivityListComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ActivityListComponent>;
    let provManagerStub: jasmine.SpyObj<ProvManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const recordIri = 'urn:record';
    const userIri = 'urn:user';
    const totalSize = 2;
    const headers = {
        'x-total-count': '' + totalSize,
    };
    const response = new HttpResponse({
        body: {activities: [{'@id': 'activity1'}, {'@id': 'activity2'}], entities: [{'@id': 'entity1'}]},
        headers: new HttpHeaders(headers)
    });

    beforeEach(async () => {
        TestBed.configureTestingModule({
        declarations: [
            ActivityListComponent,
            MockComponent(ActivityTitleComponent)
        ],
        providers: [
            MockProvider(ProvManagerService),
            MockProvider(ToastService),
            MockProvider(ProgressSpinnerService)
        ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ActivityListComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        component.entityIri = recordIri;
        component.userIri = userIri;

        provManagerStub = TestBed.inject(ProvManagerService) as jasmine.SpyObj<ProvManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        provManagerStub.getActivities.and.returnValue(of(response));
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        provManagerStub = null;
        toastStub = null;
        progressSpinnerStub = null;
    });

    describe('should initialize with the correct data', function() {
        it('unless an error occurs', fakeAsync(function() {
            provManagerStub.getActivities.and.returnValue(throwError('Error message'));
            component.ngOnInit();
            tick();
            expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.activityList);
            expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.activityList);
            expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit, entity: recordIri, agent: userIri});
            expect(component.activities).toEqual([]);
            expect(component.entities).toEqual([]);
            expect(component.totalSize).toEqual(0);
            expect(component.limit).toEqual(10);
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
        }));
        it('successfully', fakeAsync(function() {
            spyOn(component, 'getTimeStamp').and.returnValue('Today');
            component.ngOnInit();
            tick();
            expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit, entity: recordIri, agent: userIri});
            expect(component.activities).toEqual([{jsonld: {'@id': 'activity1'}, timestamp: 'Today'}, {jsonld: {'@id': 'activity2'}, timestamp: 'Today'}]);
            expect(component.entities).toEqual(response.body.entities);
            expect(component.totalSize).toEqual(totalSize);
            expect(component.limit).toEqual(10);
            expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        }));
    });
    describe('controller methods', function() {
        describe('should set the page of Activities', function() {
            it('successfully', fakeAsync(function() {
                spyOn(component, 'getTimeStamp').and.returnValue('Today');
                component.setPage();
                tick();
                expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit, entity: recordIri, agent: userIri});
                expect(component.activities).toEqual([{jsonld: {'@id': 'activity1'}, timestamp: 'Today'}, {jsonld: {'@id': 'activity2'}, timestamp: 'Today'}]);
                expect(component.entities).toEqual(response.body.entities);
                expect(component.totalSize).toEqual(totalSize);
            }));
            it('unless an error occurs', fakeAsync(function() {
                provManagerStub.getActivities.and.returnValue(throwError('Error message'));
                component.setPage();
                tick();
                expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit, entity: recordIri, agent: userIri});
            }));
        });
        it('should load more activities', function() {
            const limit = component.limit;
            spyOn(component, 'setPage');
            component.loadMore();
            expect(component.limit).toEqual(limit + 10);
            expect(component.setPage).toHaveBeenCalledWith();
        });
        it('should get the time stamp of an Activity', function() {
            expect(component.getTimeStamp({ '@id': '', [`${PROV}endedAtTime`]: [{ '@value': '2017-01-01T00:00:00' }] })).toEqual('1/1/17, 12:00 AM');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.activity-list')).length).toEqual(1);
        });
        it('depending on how many activities there are', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.activity')).length).toEqual(component.activities.length);
            expect(element.queryAll(By.css('activity-title')).length).toEqual(component.activities.length);
            expect(element.queryAll(By.css('button')).length).toEqual(0);

            component.totalSize = 10;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.activity')).length).toEqual(component.activities.length);
            expect(element.queryAll(By.css('activity-title')).length).toEqual(component.activities.length);
            expect(element.queryAll(By.css('button')).length).toEqual(1);
        });
    });
});
