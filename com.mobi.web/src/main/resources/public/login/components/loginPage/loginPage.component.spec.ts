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
import { TestBed, ComponentFixture, async, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ErrorDisplayComponentMock } from '../../../shared/components/errorDisplay/errorDisplay.component.mock';

import { LoginPageComponent } from './loginPage.component';

describe('Login Page component', () => {
    let component: LoginPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<LoginPageComponent>;
    let loginManagerStub = jasmine.createSpyObj('loginManagerService', ['login']);

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [ CommonModule, FormsModule ],
            declarations: [
                LoginPageComponent,
                ErrorDisplayComponentMock
            ],
            providers: [
                { provide: 'loginManagerService', useValue: loginManagerStub }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    describe('component methods', () => {
        describe('correctly validates a login combination', () => {
            beforeEach(() => {
                component.username = 'user';
                component.password = 'pw';
            });
            it('unless an error occurs', fakeAsync(() => {
                loginManagerStub.login.and.returnValue(Promise.reject('Error message'));
                component.login();
                tick();
                expect(loginManagerStub.login).toHaveBeenCalledWith(component.username, component.password);
                expect(component.errorMessage).toEqual('Error message');
            }));
            it('successfully', fakeAsync(() => {
                loginManagerStub.login.and.returnValue(Promise.resolve());
                component.login();
                tick();
                expect(loginManagerStub.login).toHaveBeenCalledWith(component.username, component.password);
                expect(component.errorMessage).toEqual('');
            }));
        });
    });
    describe('contains the correct html', () => {
        it('for wrapping containers', () => {
            expect(element.queryAll(By.css('.form-container')).length).toEqual(1);
        });
        it('with inputs', () => {
            expect(element.queryAll(By.css('input')).length).toEqual(2);
        });
        it('with labels', () => {
            expect(element.queryAll(By.css('label')).length).toEqual(2);
        });
        it('depending on whether an error occurred', () =>{
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.errorMessage = 'test';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('if the form is invalid', fakeAsync(() => {
            fixture.detectChanges();
            tick();
            fixture.detectChanges();
            expect(component.loginForm.form.invalid).toBe(true);
            var button = element.query(By.css('button'));
            expect(button.properties['disabled']).toBeTruthy();
        }));
        it('if the form is valid', fakeAsync(() => {
            component.username = 'test';
            component.password = 'test';
            fixture.detectChanges();
            tick()
            fixture.detectChanges();
            expect(component.loginForm.form.invalid).toBe(false);
            var button = element.query(By.css('button'));
            expect(button.properties['disabled']).toBeFalsy();
        }));
    });
});