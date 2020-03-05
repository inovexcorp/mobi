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
import {configureTestSuite} from "ng-bullet";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {SharedModule} from "../../../shared/shared.module";
import {HomeModule} from "../../home.module";
import {DebugElement} from "@angular/core";
import {HomePageComponent} from "./homePage.component";
import {ActivityTitleComponent} from "../activityTitle/activityTitle.component";
import {By} from "@angular/platform-browser";

describe('Home Page component', () => {
    let component: HomePageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<HomePageComponent>;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule, HomeModule],
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ActivityTitleComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    describe('contains the correct html', () => {
        it('for wrapping containers', () => {
            expect(element.queryAll(By.css('.home-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.welcome-banner')).length).toEqual(1);
        });
        ['activity-card', 'quick-action-grid'].forEach(test => {
            it('with a ' + test, () => {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
