/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OnEditEventI } from '../../models/onEditEvent.interface';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { EditIriOverlayComponent } from './editIriOverlay.component';

describe('Edit IRI Overlay component', function() {
    let component: EditIriOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditIriOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<EditIriOverlayComponent, OnEditEventI | boolean>>;

    const dialogData = {
        iriBegin: 'http://valid.com',
        iriThen: '/',
        iriEnd: 'end',
        validator: () => false,
        validatorMsg: 'Error Message',
        validatorKey: 'testKey'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                MatFormFieldModule,
                MatOptionModule,
                MatInputModule,
                MatSelectModule
             ],
            declarations: [
                EditIriOverlayComponent,
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: dialogData },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditIriOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditIriOverlayComponent, OnEditEventI | boolean>>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });
    
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content] error-display')).length).toEqual(0);
            expect(element.queryAll(By.css('form[mat-dialog-content] mat-form-field')).length).toEqual(3);

            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions] button')).length).toEqual(3);
        });
        it('with a button to cancel', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(3);
            expect(buttons[0].nativeElement.textContent.trim()).toContain('Cancel');
        });
        it('with a button to reset', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(3);
            expect(buttons[1].queryAll(By.css('i')).length).toEqual(1);
        });
        it('with a button to Submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(3);
            expect(buttons[2].nativeElement.textContent.trim()).toContain('Submit');
        });
        it('depending on whether the begin field is invalid', function() {
            fixture.detectChanges();
            component.iriFormControl.controls.iriBegin.setValue('(@&!%}<:<:}>^$#^(*)&%');
            component.iriFormControl.controls.iriBegin.markAsTouched();
            fixture.detectChanges();
            const errors = element.queryAll(By.css('mat-form-field.template-begins-with mat-error'));
            expect(errors.length).toEqual(1);
            expect(errors[0].nativeElement.textContent.trim()).toContain('This value is invalid');
        });
        it('depending on whether the end field is invalid', function() {
            fixture.detectChanges();
            component.iriFormControl.controls.iriEnd.setValue('(@&!%}<:<:}>^$#^(*)&%');
            component.iriFormControl.controls.iriEnd.markAsTouched();
            fixture.detectChanges();
            const errors = element.queryAll(By.css('mat-form-field.template-ends-with mat-error'));
            expect(errors.length).toEqual(1);
            expect(errors[0].nativeElement.textContent.trim()).toContain('This value is invalid');
        });
        it('depending on whether the custom validator found an error', function() {
            fixture.detectChanges();
            component.iriFormControl.setErrors({ [dialogData.validatorKey]: true});
            component.iriFormControl.markAsTouched();
            fixture.detectChanges();
            const error = element.queryAll(By.css('error-display'));
            expect(error.length).toEqual(1);
            expect(error[0].nativeElement.textContent.trim()).toContain(dialogData.validatorMsg);
        });
    });
    describe('iriFormControl validates', function() {
        beforeEach(function() {
            fixture.detectChanges();
        });
        describe('iriBegin field', function() {
            it('when it is a valid namespace', function() {
                component.iriFormControl.controls.iriBegin.setValue('https://test.com');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('VALID');
            }) ;
            it('invalid when there is a protocol missing', function() {
                component.iriFormControl.controls.iriBegin.setValue('//test.com');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('INVALID');
                expect(Object.keys(component.iriFormControl.controls.iriBegin.errors)).toEqual(['pattern']);
            }) ;
            it('invalid when field is emtpy', function() {
                component.iriFormControl.controls.iriBegin.setValue('');
                fixture.detectChanges();
                expect(component.iriFormControl.controls.iriBegin.errors).toEqual({required: true});
            }) ;
        });
        describe('iriThen field', function() {
            it('valid when iriThen field is not empty', function() {
                component.iriFormControl.controls.iriThen.setValue('HELLO');
                fixture.detectChanges();
                expect(component.iriFormControl.controls.iriThen.status).toEqual('VALID');
            }) ;
            it('invalid when iriThen field is empty', function() {
                component.iriFormControl.controls.iriThen.setValue('');
                fixture.detectChanges();
                expect(component.iriFormControl.controls.iriThen.errors).toEqual({required: true});
            }) ;
        });
        describe('iriEnd field', function() {
            it('valid when it is a valid LOCALNAME', function() {
                component.iriFormControl.controls.iriEnd.setValue('test');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('VALID');
            }) ;
            it('valid when it is a invalid LOCALNAME', function() {
                component.iriFormControl.controls.iriEnd.setValue('test.com/');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('INVALID');
            }) ;
            it('invalid when there is a protocol there', function() {
                component.iriFormControl.controls.iriEnd.setValue('http://test.com');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('INVALID');
            });
            it('invalid when iriEnd field is empty', function() {
                component.iriFormControl.controls.iriEnd.setValue('');
                fixture.detectChanges();
                expect(component.iriFormControl.controls.iriEnd.errors).toEqual({required: true});
            });
        });
    });
    describe('controller methods', function() {
        it('submit edits the iri', function() {
            fixture.detectChanges();
            component.submit();
            expect(matDialogRef.close).toHaveBeenCalledWith({value: {iriBegin: dialogData.iriBegin, iriThen: dialogData.iriThen, iriEnd: dialogData.iriEnd}});
        });
        it('resetVariables updates iriBegin, iriThen, and iriEnd', function() {
            component.iriFormControl.controls.iriBegin.setValue('new');
            component.iriFormControl.controls.iriThen.setValue('new');
            component.iriFormControl.controls.iriEnd.setValue('new');
            component.resetVariables();
            fixture.detectChanges();
            expect(component.iriFormControl.controls.iriBegin.value,).toBe(dialogData.iriBegin);
            expect(component.iriFormControl.controls.iriThen.value).toBe(dialogData.iriThen);
            expect(component.iriFormControl.controls.iriEnd.value).toBe(dialogData.iriEnd);
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call resetVariables when the button is clicked', function() {
        spyOn(component, 'resetVariables');
        const button = element.queryAll(By.css('.mat-dialog-actions button'))[1];
        button.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.resetVariables).toHaveBeenCalledWith();
    });
});
