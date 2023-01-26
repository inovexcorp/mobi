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
import { configureTestSuite } from 'ng-bullet';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';

import { SharedModule } from '../../../shared/shared.module';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ActivityCardComponent } from '../activityCard/activityCard.component';
import { QuickActionGridComponent } from '../quickActionGrid/quickActionGrid.component';
import { HomePageComponent } from './homePage.component';

describe('Home Page component', function() {
    let component: HomePageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<HomePageComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                HomePageComponent,
                MockComponent(ActivityCardComponent),
                MockComponent(QuickActionGridComponent)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(HomePageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.home-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.welcome-banner')).length).toEqual(1);
        });
        ['activity-card', 'quick-action-grid'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
