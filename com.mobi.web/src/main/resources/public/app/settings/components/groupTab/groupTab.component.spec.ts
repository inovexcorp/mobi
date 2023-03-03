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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { Group } from '../../../shared/models/group.interface';
import { GroupTabComponent } from './groupTab.component';

describe('Group Tab component', function() {
    let component: GroupTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<GroupTabComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;

    const user = 'user';
    const group1: Group = {
        title: 'group1', roles: [], members: [user, 'test'],
        external: false,
        description: ''
    };
    const group2: Group = {
        title: 'group2', roles: [], members: [user],
        external: false,
        description: ''
    };
    const group3: Group = {
        title: 'group3', roles: [], members: ['test'],
        external: false,
        description: ''
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                GroupTabComponent,
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                MockProvider(LoginManagerService),
                MockProvider(UserManagerService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GroupTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;

        loginManagerStub.currentUser = user;
        userManagerStub.groups = [group1, group2, group3];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        loginManagerStub = null;
    });

    describe('should initialize with', function() {
        it('the user\'s groups', function() {
            component.ngOnInit();
            expect(component.groups).toEqual([group1, group2]);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.group-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-6')).length).toEqual(1);
            expect(element.queryAll(By.css('.offset-3')).length).toEqual(1);
        });
        it('with a .user-groups-list', function() {
            expect(element.queryAll(By.css('.user-groups-list')).length).toEqual(1);
        });
        it('depending on the number of groups', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.no-groups')).length).toEqual(0);
            expect(element.queryAll(By.css('.user-group')).length).toEqual(2);
            
            component.groups = [];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.no-groups')).length).toEqual(1);
            expect(element.queryAll(By.css('.user-group')).length).toEqual(0);
        });
    });
});
