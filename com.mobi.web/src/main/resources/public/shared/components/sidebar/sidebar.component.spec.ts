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
import { MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { User } from '../../models/user.interface';
import { LoginManagerService } from '../../services/loginManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { SidebarComponent } from './sidebar.component';

describe('Sidebar component', function() {
    let component: SidebarComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SidebarComponent>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let router: Router;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                MatDividerModule,
                MatIconModule,
                MatMenuModule,
                MatButtonModule,
                RouterTestingModule.withRoutes([])
            ],
            declarations: [
                SidebarComponent,
            ],
            providers: [
                MockProvider(LoginManagerService),
                MockProvider(UserManagerService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SidebarComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        loginManagerStub = TestBed.get(LoginManagerService);
        userManagerStub = TestBed.get(UserManagerService);
        router = TestBed.get(Router);
        spyOn(router, 'navigate');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        loginManagerStub = null;
        router = null;
    });

    it('should initialize correctly', function() {
        component.ngOnInit();
        expect(component.perspectives.length).toEqual(8);
    });
    describe('controller methods', function() {
        it('should toggle whether the nav is collapsed', function() {
            spyOn(component.collapsedNavChange, 'emit');
            expect(component.collapsedNav).toBeFalsy();
            component.toggle();
            expect(component.collapsedNav).toBeTruthy();
            expect(component.collapsedNavChange.emit).toHaveBeenCalledWith(component.collapsedNav);
        });
        it('should get the display of the current user', function() {
            loginManagerStub.currentUserIRI = 'urn:test';
            const user: User = {
                iri: loginManagerStub.currentUserIRI,
                firstName: 'Bruce',
                external: false,
                username: '',
                lastName: '',
                email: '',
                roles: []
            };
            userManagerStub.users = [user];
            expect(component.getUserDisplay()).toEqual('Bruce');
            user.username = 'batman';
            expect(component.getUserDisplay()).toEqual('Bruce');
            delete user.firstName;
            expect(component.getUserDisplay()).toEqual('batman');
            userManagerStub.users = [];
            expect(component.getUserDisplay()).toEqual('');            
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.sidebar')).length).toEqual(1);
        });
        ['.image-container', '.current-user-box', '.main-nav', '.hover-box', '.version'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether the nav is collapsed', function() {
            fixture.detectChanges();
            const sidebar = element.queryAll(By.css('.sidebar'))[0];
            const logo = element.queryAll(By.css('.image-container a img'))[0];
            const userbox = element.queryAll(By.css('.current-user-box'))[0];
            const version = element.queryAll(By.css('.version small'))[0];
            expect(sidebar.classes['open']).toBeTruthy();
            expect(logo.nativeElement.src).not.toContain('icon');
            expect(userbox.classes['text-truncate']).toBeTruthy();
            expect(version.classes['shown']).toBeTruthy();
            expect(element.queryAll(By.css('.current-user-box .user-title')).length).toEqual(1);
            expect(element.queryAll(By.css('.nav-item .nav-link span')).length).toBeGreaterThan(0);

            component.collapsedNav = true;
            fixture.detectChanges();
            expect(sidebar.classes['collapsed']).toBeTruthy();
            expect(logo.nativeElement.src).toContain('icon');
            expect(userbox.classes['text-truncate']).toBeFalsy();
            expect(version.classes['hidden']).toBeTruthy();
            expect(element.queryAll(By.css('.current-user-box .user-title')).length).toEqual(0);
            expect(element.queryAll(By.css('.nav-item .nav-link span')).length).toEqual(0);
        });
        it('depending on the number of perspectives', function() {
            expect(element.queryAll(By.css('.main-nav .nav-item')).length).toEqual(component.perspectives.length);
        });
    });
});