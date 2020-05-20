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
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabsModule } from '@angular/material/tabs';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { GroupTabComponent } from '../groupTab/groupTab.component';
import { PasswordTabComponent } from '../passwordTab/passwordTab.component';
import { ProfileTabComponent } from '../profileTab/profileTab.component';
import { SettingsPageComponent } from './settingsPage.component';

fdescribe('Settings Page component', () => {
    let element: DebugElement;
    let fixture: ComponentFixture<SettingsPageComponent>;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [
                MatTabsModule,
                BrowserAnimationsModule
            ],
            declarations: [
                SettingsPageComponent,
                MockComponent(GroupTabComponent),
                MockComponent(PasswordTabComponent),
                MockComponent(ProfileTabComponent)
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingsPageComponent);
        element = fixture.debugElement;
    });

    afterEach(() => {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
    });

    describe('contains the correct html', () => {
        it('for wrapping containers', () => {
            expect(element.query(By.css('.settings-page'))).toBeTruthy();
        });
        it('with .mat-tab-labels', () => {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.mat-tab-label')).length).toEqual(3);
        });
        it('with a mat-tab-group', () => {
            fixture.detectChanges();
            expect(element.query(By.css('mat-tab-group'))).toBeTruthy();
        });
        [
            {el: 'profile-tab', idx: 0},
            {el: 'group-tab', idx: 1},
            {el: 'password-tab', idx: 2}
        ].forEach(test => {
            it('with a ' + test.el, fakeAsync(() => {
                fixture.detectChanges();
                element.queryAll(By.css('.mat-tab-label'))[test.idx].nativeElement.click();
                fixture.detectChanges();
                tick();
                fixture.detectChanges();
                expect(element.query(By.css(test.el))).toBeTruthy();
            }));
        });
    });
});