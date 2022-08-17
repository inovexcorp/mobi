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
import { MatButtonModule, MatDialogModule, MatDialogRef, MatIconModule, MAT_DIALOG_DATA } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyUploadItem } from '../../../shared/models/ontologyUploadItem.interface';
import { UploadErrorsOverlayComponent } from './uploadErrorsOverlay.component';

describe('Upload Errors Overlay component', function() {
    let component: UploadErrorsOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UploadErrorsOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadErrorsOverlayComponent>>;

    const uploadItem: OntologyUploadItem = {
        id: 'id',
        title: 'Title',
        sub: undefined,
        status: undefined,
        error: {
            error: 'Error',
            errorMessage: 'Error Message',
            errorDetails: ['Detail 1', 'Detail 2']
        }
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
            ],
            declarations: [
                UploadErrorsOverlayComponent,
            ],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { item: uploadItem } },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(UploadErrorsOverlayComponent);
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
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with the error\'s details', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('ul li')).length).toEqual(uploadItem.error.errorDetails.length);
        });
        it('with a button to cancel', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(1);
            expect(buttons[0].nativeElement.textContent.trim()).toContain('Cancel');
        });
    });
    it('should initialize with the correct values', function() {
        component.ngOnInit();
        expect(component.itemTitle).toEqual(uploadItem.title);
        expect(component.errorMessage).toEqual(uploadItem.error.errorMessage);
        expect(component.errorDetails).toEqual(uploadItem.error.errorDetails);
    });
    // TODO Cancel button test

    it('cancel should call the correct method and set the correct variable', function() {
        component.cancel();
        expect(matDialogRef.close).toHaveBeenCalledWith();
    });

});
