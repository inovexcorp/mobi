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
import { ErrorDisplayComponentMock } from '../../../shared/components/errorDisplay/errorDisplay.component.mock';
import { LoginPageComponent } from './loginPage.component';
import loginManagerService from "../../../shared/services/loginManager.service";
import {SharedModule} from "../../../shared/shared.module";

describe('Login Page component', () => {
    let component: LoginPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<LoginPageComponent>;
    let loginManagerStub = jasmine.createSpyObj('loginManagerService', ['login']);

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                LoginPageComponent
            ],
            providers: [
                { provide: 'loginManagerService', useValue: loginManagerStub },
                { provide: 'ErrorDisplayComponent', useValue: ErrorDisplayComponentMock },
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
                component.loginForm.controls['username'].setValue('user');
                component.loginForm.controls['password'].setValue('password');
            });
            it('unless an error occurs', fakeAsync(() => {
                loginManagerStub.login.and.returnValue(Promise.reject('Error message'));
                component.login();
                tick();
                expect(loginManagerStub.login).toHaveBeenCalledWith(component.loginForm.controls['username'].value, component.loginForm.controls['password'].value);
                expect(component.errorMessage).toEqual('Error message');
            }));
            it('successfully', fakeAsync(() => {
                loginManagerStub.login.and.returnValue(Promise.resolve());
                component.login();
                tick();
                expect(loginManagerStub.login).toHaveBeenCalledWith(component.loginForm.controls['username'].value, component.loginForm.controls['password'].value);
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
            expect(element.query(By.css('error-display'))).toBeFalsy();
            fixture.detectChanges();
            component.errorMessage = 'test';
            fixture.detectChanges();
            expect(element.query(By.css('error-display'))).toBeTruthy();
        });
        it('if the form is invalid', fakeAsync(() => {
            fixture.detectChanges();
            tick();
            fixture.detectChanges();
            expect(component.loginForm.invalid).toBe(true);
            let button = element.query(By.css('button'));
            expect(button.properties['disabled']).toBeTruthy();
        }));
        it('if the form is valid', fakeAsync(() => {
            component.loginForm.controls['username'].setValue('user');
            component.loginForm.controls['password'].setValue('password');
            fixture.detectChanges();
            tick();
            fixture.detectChanges();
            expect(component.loginForm.invalid).toBe(false);
            let button = element.query(By.css('button'));
            expect(button.properties['disabled']).toBeFalsy();
        }));
    });
});