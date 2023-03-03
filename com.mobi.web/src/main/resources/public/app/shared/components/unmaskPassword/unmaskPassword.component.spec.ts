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
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { UnmaskPasswordComponent } from './unmaskPassword.component';

describe('Unmask Password component', function() {
    let component: UnmaskPasswordComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UnmaskPasswordComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule
            ],
            declarations: [
                UnmaskPasswordComponent
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UnmaskPasswordComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.parentForm = new FormGroup({
            unmaskPassword: new FormControl('', Validators.required)
        });
        component.label = 'Test';
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize with the correct value for', function() {
        it('showPassword', function() {
            expect(component.showPassword).toBeFalse();
        });
    });
    describe('controller methods', function() {
        it('correctly determine whether the field is required', function() {
            expect(component.isRequired()).toBeTrue();

            component.parentForm.controls.unmaskPassword.clearValidators();
            expect(component.isRequired()).toBeFalse();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.unmask-password')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(1);
        });
        it('with a label', function() {
            const label = element.queryAll(By.css('mat-label'))[0];
            expect(label).not.toBeFalsy();
            expect(label.nativeElement.innerHTML).toEqual('Test');
        });
        it('with a button for changing input type', function() {
            const buttons = element.queryAll(By.css('button'));
            expect(buttons.length).toEqual(1);
            const button = buttons[0];
            expect(button.nativeElement.innerHTML).toEqual('SHOW');
            expect(element.queryAll(By.css('input[type="password"')).length).toEqual(1);
            expect(element.queryAll(By.css('input[type="text"')).length).toEqual(0);
            button.triggerEventHandler('click', null);
            fixture.detectChanges();
            expect(component.showPassword).toBeTrue();
            expect(element.queryAll(By.css('input[type="password"')).length).toEqual(0);
            expect(element.queryAll(By.css('input[type="text"')).length).toEqual(1);
            expect(button.nativeElement.innerHTML).toEqual('HIDE');
        });
        it('depending on input validity', function() {
            const inputEl = element.queryAll(By.css('input'))[0];
            expect(inputEl).not.toBeFalsy();
            expect(inputEl.classes['is-invalid']).toBeFalsy();
            const inputControl = component.parentForm.get('unmaskPassword');
            expect(inputControl).not.toBeFalsy();
            
            inputControl.markAsDirty();
            fixture.detectChanges();
            expect(inputEl.classes['is-invalid']).toBeTruthy();
        });
    });
});
