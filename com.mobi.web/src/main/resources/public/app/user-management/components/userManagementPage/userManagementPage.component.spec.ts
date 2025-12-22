/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabsModule } from '@angular/material/tabs';

import { MockComponent, MockProvider } from 'ng-mocks';
import { ngMocks } from 'ng-mocks'; // Ensures every method in Mocked Components are Jasmine spies

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { GroupsPageComponent } from '../groupsPage/groupsPage.component';
import { LogViewerPageComponent } from '../log-viewer-page/log-viewer-page.component';
import { PermissionsPageComponent } from '../permissionsPage/permissionsPage.component';
import { RepositoriesPageComponent } from '../repositories-page/repositories-page.component';
import { SettingEditPageComponent } from '../../../shared/components/settingEditPage/settingEditPage.component';
import { SettingManagerService } from '../../../shared/services/settingManager.service';
import { UsersPageComponent } from '../usersPage/usersPage.component';
import { UserStateService } from '../../../shared/services/userState.service';
import { UserManagementPageComponent } from './userManagementPage.component';

// auto spy
ngMocks.autoSpy('jasmine');

describe('User Management Page component', function() {
  let component: UserManagementPageComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<UserManagementPageComponent>;
  let userStateStub: jasmine.SpyObj<UserStateService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatTabsModule
      ],
      declarations: [
        UserManagementPageComponent,
        MockComponent(UsersPageComponent),
        MockComponent(GroupsPageComponent),
        MockComponent(PermissionsPageComponent),
        MockComponent(SettingEditPageComponent),
        MockComponent(RepositoriesPageComponent),
        MockComponent(LogViewerPageComponent)
      ],
      providers: [
        MockProvider(UserStateService),
        MockProvider(SettingManagerService)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementPageComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    userStateStub = TestBed.inject(UserStateService) as jasmine.SpyObj<UserStateService>;
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    userStateStub = null;
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
      expect(element.queryAll(By.css('mat-tab-body')).length).toBe(6);
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
    it('with a tab for repositories-page', fakeAsync(function() {
      userStateStub.tabIndex = 4;
      fixture.detectChanges();
      tick();
      expect(element.queryAll(By.css('app-repositories-page')).length).toBe(1);
    }));
    it('with a tab for log-viewer-page', fakeAsync(function() {
      userStateStub.tabIndex = 5;
      fixture.detectChanges();
      tick();
      expect(element.queryAll(By.css('app-log-viewer-page')).length).toBe(1);
    }));
  });
});
