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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import 'ng-mocks/dist/jasmine'; // Ensures every method in Mocked Components are Jasmine spies

import { of } from 'rxjs';

import { cleanStylesFromDOM, mockUtil, mockPrefixes} from '../../../../../../test/ts/Shared';

import { SettingEditPageComponent } from '../../../shared/components/settingEditPage/settingEditPage.component';
import { UserStateService } from '../../../shared/services/userState.service';
import { GroupsPageComponent } from '../groupsPage/groupsPage.component';
import { PermissionsPageComponent } from '../permissionsPage/permissionsPage.component';
import { UsersPageComponent } from '../usersPage/usersPage.component';
import { UserManagementPageComponent } from './userManagementPage.component';

describe('User Management Page component', function() {
    let component: UserManagementPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UserManagementPageComponent>;
    let userStateStub: jasmine.SpyObj<UserStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                MatTabsModule,
                NoopAnimationsModule
            ],
            declarations: [
                UserManagementPageComponent,
                MockComponent(UsersPageComponent),
                MockComponent(GroupsPageComponent),
                MockComponent(PermissionsPageComponent),
                MockComponent(SettingEditPageComponent)
            ],
            providers: [
                MockProvider(UserStateService),
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'settingManagerService', useFactory: () => jasmine.createSpyObj('settingManagerService', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(UserManagementPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userStateStub = TestBed.get(UserStateService);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userStateStub = null;
    });

    describe('controller methods', function() {
        describe('should handle when a tab changes', function() {
            it('to the users page', function() {
                const event = new MatTabChangeEvent();
                event.index = 0;
                component.onTabChanged(event);
                expect(component.permissionsPage.reset).not.toHaveBeenCalled();
            });
            it('to the groups page', function() {
                const event = new MatTabChangeEvent();
                event.index = 1;
                component.onTabChanged(event);
                expect(component.permissionsPage.reset).not.toHaveBeenCalled();
            });
            it('to the permissions tab', function() {
                const event = new MatTabChangeEvent();
                event.index = 2;
                component.onTabChanged(event);
                expect(component.permissionsPage.reset).toHaveBeenCalled();
            });
            it('to the application settings page', function() {
                const event = new MatTabChangeEvent();
                event.index = 3;
                component.onTabChanged(event);
                expect(component.permissionsPage.reset).not.toHaveBeenCalled();
            });

        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.user-management-page')).length).toEqual(1);
        });
        it('with a mat-tab-group', function() {
            expect(element.queryAll(By.css('mat-tab-group')).length).toBe(1);
        });
        it('with tabs for each page', fakeAsync(function() {
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('mat-tab-body')).length).toBe(4);
        }));
        it('with a tab for users-page', fakeAsync(function() {
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('users-page')).length).toBe(1);
        }));
        it('with a tab for groups-page', fakeAsync(function() {
            userStateStub.tabIndex = 1;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('groups-page')).length).toBe(1);
        }));
        it('with a tab for permissions-page', fakeAsync(function() {
            userStateStub.tabIndex = 2;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('permissions-page')).length).toBe(1);
        }));
        it('with a tab for application-settings-page', fakeAsync(function() {
            userStateStub.tabIndex = 3;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('setting-edit-page')).length).toBe(1);
        }));
    });
});
