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

import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { throwError, of } from 'rxjs';

import {
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { ActivityTitleComponent } from '../activityTitle/activityTitle.component';
import { PROV } from '../../../prefixes';
import { UtilService } from '../../../shared/services/util.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { ProvManagerService } from '../../../shared/services/provManager.service';
import { ActivityCardComponent } from './activityCard.component';
import { HttpHeaders, HttpResponse } from '@angular/common/http';

describe('Activity Card component', function() {
    let component: ActivityCardComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ActivityCardComponent>;
    let provManagerStub: jasmine.SpyObj<ProvManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const totalSize = 2;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ActivityCardComponent,
                MockComponent(ActivityTitleComponent)
            ],
            providers: [
                MockProvider(ProvManagerService),
                MockProvider(UtilService),
                MockProvider(ProgressSpinnerService)
            ],
        });
    });

    beforeEach(fakeAsync(function() {
        fixture = TestBed.createComponent(ActivityCardComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        provManagerStub = TestBed.get(ProvManagerService);
        utilStub = TestBed.get(UtilService);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);

        this.headers = {
            'x-total-count': '' + totalSize,
        };
        this.response = new HttpResponse({
            body: {activities: [{'@id': 'activity1'}, {'@id': 'activity2'}], entities: [{'@id': 'entity1'}]},
            headers: new HttpHeaders(this.headers)
        });
        provManagerStub.getActivities.and.returnValue(of(this.response));
    }));

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        provManagerStub = null;
        utilStub = null;
        progressSpinnerStub = null;
    });
    
    describe('should initialize with the correct data', function() {
        it('unless an error occurs', fakeAsync(function() {
            provManagerStub.getActivities.and.returnValue(throwError('Error message'));
            component.ngOnInit();
            tick();
            expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.cardBody);
            expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.cardBody);
            expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit});
            expect(component.activities).toEqual([]);
            expect(component.entities).toEqual([]);
            expect(component.totalSize).toEqual(0);
            expect(component.limit).toEqual(10);
            expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
        }));
        it('successfully', fakeAsync(function() {
            component.ngOnInit();
            tick();
            expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit});
            expect(component.activities).toEqual(this.response.body.activities);
            expect(component.entities).toEqual(this.response.body.entities);
            expect(component.totalSize).toEqual(totalSize);
            expect(component.limit).toEqual(10);
            expect(utilStub.createErrorToast).not.toHaveBeenCalled();
        }));
    });
    describe('controller methods', function() {
        describe('should set the page of Activities', function() {
            it('successfully', fakeAsync(function() {
                component.setPage();
                tick();
                expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit});
                expect(component.activities).toEqual(this.response.body.activities);
                expect(component.entities).toEqual(this.response.body.entities);
                expect(component.totalSize).toEqual(totalSize);
            }));
            it('unless an error occurs', fakeAsync(function() {
                provManagerStub.getActivities.and.returnValue(throwError('Error message'));
                component.setPage();
                tick();
                expect(provManagerStub.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: component.limit});
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
            utilStub.getPropertyValue.and.returnValue('2017-01-01T00:00:00');
            utilStub.getDate.and.returnValue('date');
            expect(component.getTimeStamp({'@id': ''})).toEqual('date');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith({'@id': ''}, PROV + 'endedAtTime');
            expect(utilStub.getDate).toHaveBeenCalledWith('2017-01-01T00:00:00', 'short');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.activity-card')).length).toEqual(1);
            expect(element.queryAll(By.css('.card')).length).toEqual(1);
            expect(element.queryAll(By.css('.card-header')).length).toEqual(1);
            expect(element.queryAll(By.css('.card-body')).length).toEqual(1);
        });
        it('with a .card-header-tabs', function() {
            expect(element.queryAll(By.css('.card-header-tabs')).length).toEqual(1);
        });
        it('with a .nav-item', function() {
            expect(element.queryAll(By.css('.card-header-tabs .nav-item')).length).toEqual(1);
        });
        it('depending on how many activities there are', function() {
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
