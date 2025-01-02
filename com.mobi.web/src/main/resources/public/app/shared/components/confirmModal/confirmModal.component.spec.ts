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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ConfirmModalComponent } from './confirmModal.component';

describe('Confirm Modal component', function() {
    let component: ConfirmModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ConfirmModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<ConfirmModalComponent>>;
    const data = {
        content: 'This is a <strong>Test</strong>'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule
            ],
            declarations: [
                ConfirmModalComponent
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ConfirmModalComponent>>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
    });

    describe('controller methods', function() {
        it('should deny the action represented', function() {
            component.deny();
            expect(matDialogRef.close).toHaveBeenCalledWith(false);
        });
        it('should confirm the action represented', function() {
            component.confirm();
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with the provided content', function() {
            fixture.detectChanges();
            const div = element.query(By.css('div[mat-dialog-content]'));
            expect(div.nativeElement.innerHTML).toContain(data.content);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Yes']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Yes']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(component, 'deny');
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(component.deny).toHaveBeenCalledWith();
    });
    it('should call add when the submit button is clicked', function() {
        spyOn(component, 'confirm');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.confirm).toHaveBeenCalledWith();
    });
});
