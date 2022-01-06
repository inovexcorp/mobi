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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    mockLoginManager,
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { GroupTabComponent } from './groupTab.component';

describe('Group Tab component', function() {
    let component: GroupTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<GroupTabComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let loginManagerStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                GroupTabComponent,
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                { provide: 'loginManagerService', useClass: mockLoginManager },
                MockProvider(UserManagerService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(GroupTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        loginManagerStub = TestBed.get('loginManagerService');
        userManagerStub = TestBed.get(UserManagerService);

        this.user = 'user';
        this.group1 = {title: 'group1', roles: [],  members: [this.user, 'test']};
        this.group2 = {title: 'group2', roles: [], members: [this.user]};
        loginManagerStub.currentUser = this.user;
        userManagerStub.groups = [this.group1, this.group2, {members: ['test']}];
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
            expect(component.groups).toEqual([this.group1, this.group2]);
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
