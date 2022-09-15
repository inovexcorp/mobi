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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule, MatOptionModule, MatSelectModule, MAT_DIALOG_DATA } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OnEditEventI } from '../../models/onEditEvent.interface';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { EditIriOverlayComponent } from './editIriOverlay.component';

describe('Edit IRI Overlay component', function() {
    let component: EditIriOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditIriOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<EditIriOverlayComponent, OnEditEventI | boolean>>;

    let isDisabled = false;
    const dialogData = {
        iriBegin: 'http://valid.com',
        iriThen: '/',
        iriEnd: 'end',
        validator: () => isDisabled,
        validatorMsg: 'error'
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(EditIriOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
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
        it('with the error\'s details', function() {
            component.iriFormControl.controls.beginsWith.setValue('');
            fixture.detectChanges();
            // console.log(component.iriFormControl.controls.beginsWith.errors)
            // expect(element.queryAll(By.css('mat-error')).length).toEqual(2);
            // expect(element.queryAll(By.css('mat-form-field.template-begins-with mat-error'))[0].nativeElement.textContent.trim()).toContain('This value is invalid');
            // expect(element.queryAll(By.css('mat-form-field.template-begins-with mat-error'))[1].nativeElement.textContent.trim()).toContain('This value is required');
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
      
            //     it('depending on whether the begin field is invalid', function() {
            //         var beginInput = angular.element(this.element.querySelectorAll('.begin-container input')[0]);
            //         expect(beginInput.hasClass('is-invalid')).toBe(false);
        
            //         component.iriForm = {
            //             iriBegin: {
            //                 '$error': {
            //                     pattern: true
            //                 }
            //             }
            //         };
            //         scope.$digest();
            //         expect(beginInput.hasClass('is-invalid')).toBe(true);
            //     });
            //     it('depending on whether the ends field is invalid', function() {
            //         var endsInput = angular.element(this.element.querySelectorAll('.ends-container input')[0]);
            //         expect(endsInput.hasClass('is-invalid')).toBe(false);
        
            //         component.iriForm = {
            //             iriEnd: {
            //                 '$error': {
            //                     pattern: true
            //                 }
            //             }
            //         };
            //         scope.$digest();
            //         expect(endsInput.hasClass('is-invalid')).toBe(true);
            //     });
            //     it('depending on the form validity', function() {
            //         var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary:not(.refresh-button)')[0]);
            //         expect(button.attr('disabled')).toBeFalsy();
        
            //         component.iriForm.$invalid = true;
            //         scope.$digest();
            //         expect(button.attr('disabled')).toBeTruthy();
            //     });
            //     describe('depending on whether the custom validator', function() {
            //         beforeEach(function() {
            //             component.iriForm.$invalid = false;
            //         });
            //         describe('is present and returns', function() {
            //             it('true', function() {
            //                 this.isDisabled = true;
            //                 scope.$digest();
        
            //                 var disabled = this.element.querySelectorAll(':disabled');
            //                 expect(disabled.length).toBe(1);
            //                 expect(angular.element(disabled[0]).text()).toBe('Submit');
        
            //                 var errorDisplay = this.element.find('error-display');
            //                 expect(errorDisplay.length).toEqual(1);
            //                 expect(errorDisplay.text()).toEqual(scope.resolve.customValidation.msg);
            //             });
            //             it('false', function() {
            //                 expect(this.element.querySelectorAll(':disabled').length).toBe(0);
            //                 expect(this.element.find('error-display').length).toBe(0);
            //             });
            //         });
            //         it('is not present', function() {
            //             delete scope.resolve.customValidation;
            //             scope.$digest();
        
            //             expect(this.element.querySelectorAll(':disabled').length).toBe(0);
            //             expect(this.element.find('error-display').length).toBe(0);
            //         });
            //     });
    });
    describe('iriFormControl validates', function() {
        beforeEach(function() {
            fixture.detectChanges();
        });
        describe('beginsWith field', function() {
            it('when it is a valid namespace', function() {
                component.iriFormControl.controls.beginsWith.setValue('https://test.com');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('VALID');
            }) ;
            it('invalid when there is a protocol missing', function() {
                component.iriFormControl.controls.beginsWith.setValue('//test.com');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('INVALID');
                expect(Object.keys(component.iriFormControl.controls.beginsWith.errors)).toEqual(['pattern']);
            }) ;
            it('invalid when field is emtpy', function() {
                component.iriFormControl.controls.beginsWith.setValue('');
                fixture.detectChanges();
                expect(component.iriFormControl.controls.beginsWith.errors).toEqual({required: true});
            }) ;
        });
        describe('then field', function() {
            it('valid when then field is not emtpy', function() {
                component.iriFormControl.controls.then.setValue('HELLO');
                fixture.detectChanges();
                expect(component.iriFormControl.controls.then.status).toEqual('VALID');
            }) ;
            it('invalid when then field is emtpy', function() {
                component.iriFormControl.controls.then.setValue('');
                fixture.detectChanges();
                expect(component.iriFormControl.controls.then.errors).toEqual({required: true});
            }) ;
        });
        describe('endsWith field', function() {
            it('valid when it is a valid LOCALNAME', function() {
                component.iriFormControl.controls.endsWith.setValue('test');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('VALID');
            }) ;
            it('valid when it is a invalid LOCALNAME', function() {
                component.iriFormControl.controls.endsWith.setValue('test.com/');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('INVALID');
            }) ;
            it('invalid when there is a protocol there', function() {
                component.iriFormControl.controls.endsWith.setValue('http://test.com');
                fixture.detectChanges();
                expect(component.iriFormControl.status).toEqual('INVALID');
            });
            it('invalid when endsWith field is emtpy', function() {
                component.iriFormControl.controls.endsWith.setValue('');
                fixture.detectChanges();
                expect(component.iriFormControl.controls.endsWith.errors).toEqual({required: true});
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
            component.iriFormControl.controls.beginsWith.setValue('new');
            component.iriFormControl.controls.then.setValue('new');
            component.iriFormControl.controls.endsWith.setValue('new');
            component.resetVariables();
            fixture.detectChanges();
            expect(component.iriFormControl.controls.beginsWith.value,).toBe(dialogData.iriBegin);
            expect(component.iriFormControl.controls.then.value).toBe(dialogData.iriThen);
            expect(component.iriFormControl.controls.endsWith.value).toBe(dialogData.iriEnd);
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button'))[0];
        cancelButton.triggerEventHandler('click', null);
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
