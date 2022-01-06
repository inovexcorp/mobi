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
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MockComponent } from 'ng-mocks';
import 'ng-mocks/dist/jasmine'; // Ensures every method in Mocked Components are Jasmine spies

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { GroupTabComponent } from '../groupTab/groupTab.component';
import { PasswordTabComponent } from '../passwordTab/passwordTab.component';
import { ProfileTabComponent } from '../profileTab/profileTab.component';
import { SettingsPageComponent } from './settingsPage.component';
import { SettingEditPageComponent } from '../../../shared/components/settingEditPage/settingEditPage.component';
import { of } from 'rxjs';

describe('Settings Page component', function() {
    let component: SettingsPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SettingsPageComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                MatTabsModule,
                NoopAnimationsModule
            ],
            declarations: [
                SettingsPageComponent,
                MockComponent(GroupTabComponent),
                MockComponent(PasswordTabComponent),
                MockComponent(ProfileTabComponent),
                MockComponent(SettingEditPageComponent)
            ],
            providers: [
                { provide: 'settingManagerService', useFactory: () => jasmine.createSpyObj('settingManagerService', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SettingsPageComponent);
        element = fixture.debugElement;
        component = fixture.componentInstance;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
        component = null;
    });
    
    describe('controller methods', function() {
        describe('should handle when a tab changes', function() {
            it('to the profile tab', function() {
                const event = new MatTabChangeEvent();
                event.index = 0;
                component.onTabChanged(event);
                expect(component.profileTab.reset).toHaveBeenCalled();
                expect(component.passwordTab.reset).not.toHaveBeenCalled();
            });
            it('to the groups tab', function() {
                const event = new MatTabChangeEvent();
                event.index = 1;
                component.onTabChanged(event);
                expect(component.profileTab.reset).not.toHaveBeenCalled();
                expect(component.passwordTab.reset).not.toHaveBeenCalled();
            });
            it('to the password tab', function() {
                const event = new MatTabChangeEvent();
                event.index = 2;
                component.onTabChanged(event);
                expect(component.profileTab.reset).not.toHaveBeenCalled();
                expect(component.passwordTab.reset).toHaveBeenCalled();
            });
            it('to the settings tab', function() {
                const event = new MatTabChangeEvent();
                event.index = 3;
                component.onTabChanged(event);
                expect(component.profileTab.reset).not.toHaveBeenCalled();
                expect(component.passwordTab.reset).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.query(By.css('.settings-page'))).toBeTruthy();
        });
        it('with .mat-tab-labels', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.mat-tab-label')).length).toEqual(4);
        });
        it('with a mat-tab-group', function() {
            fixture.detectChanges();
            expect(element.query(By.css('mat-tab-group'))).toBeTruthy();
        });
        [
            {el: 'profile-tab', idx: 0},
            {el: 'group-tab', idx: 1},
            {el: 'password-tab', idx: 2},
            {el: 'setting-edit-page', idx: 3}
        ].forEach(test => {
            it('with a ' + test.el, fakeAsync(function() {
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
