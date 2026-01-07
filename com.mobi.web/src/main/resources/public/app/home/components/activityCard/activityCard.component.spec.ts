/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { ActivityListComponent } from '../../../shared/components/activity-list/activity-list.component';
import { ActivityCardComponent } from './activityCard.component';

describe('Activity Card component', function() {
    let component: ActivityCardComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ActivityCardComponent>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatCardModule,
                MatTabsModule,
            ],
            declarations: [
                ActivityCardComponent,
                MockComponent(ActivityListComponent)
            ],
            providers: [
                MockProvider(LoginManagerService),
            ],
        });
    });

    beforeEach(fakeAsync(function() {
        fixture = TestBed.createComponent(ActivityCardComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        loginManagerStub.currentUserIRI = 'urn:user';
    }));

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        loginManagerStub = null;
    });
    
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.activity-card')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-card')).length).toEqual(1);
        });
        it('with a mat-tab-group', function() {
            expect(element.queryAll(By.css('mat-tab-group')).length).toEqual(1);
        });
        it('with tabs for each activity list', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-tab-body')).length).toEqual(2);
        });
        it('with a tab for Recent Activity', fakeAsync(function() {
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('app-activity-list')).length).toBe(1);
        }));
        it('with a tab for branch-list', fakeAsync(function() {
            component.tabIndex = 1;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('app-activity-list')).length).toBe(1);
        }));
    });
});
