/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { MatButtonModule, MatDialogModule, MatDialogRef } from '@angular/material';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM, mockUtil } from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { RdfUpload } from '../../../shared/models/rdfUpload.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { NewShapesGraphRecordModalComponent } from './newShapesGraphRecordModal.component';

describe('New Shapes Graph Record Modal component', function() {
    let component: NewShapesGraphRecordModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<NewShapesGraphRecordModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<NewShapesGraphRecordModalComponent>>;
    let shapesGraphStateStub;
    let utilStub;
    const file: File = new File([''], 'filename', { type: 'text/html' });
    const rdfUpload: RdfUpload = {
        title: 'Record Name',
        description: 'Some description',
        keywords: ['keyword1', 'keyword2'],
        file: file
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule,
                MatChipsModule,
                MatIconModule
            ],
            declarations: [
                NewShapesGraphRecordModalComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(FileInputComponent)
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: 'utilService', useClass: mockUtil },
                MockProvider(ShapesGraphStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(NewShapesGraphRecordModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.uploadShapesGraph.and.returnValue(Promise.resolve());
        utilStub = TestBed.get('utilService');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        shapesGraphStateStub = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        it('should create a shapes graph record and close the dialog',  async function() {
            component.createRecordForm.controls['title'].setValue(rdfUpload.title);
            component.createRecordForm.controls['description'].setValue(rdfUpload.description);
            component.keywordControls.push(component['fb'].control(rdfUpload.keywords[0]));
            component.keywordControls.push(component['fb'].control(rdfUpload.keywords[1]));
            component.selectedFile = file;
            component.create();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(shapesGraphStateStub.uploadShapesGraph).toHaveBeenCalledWith(rdfUpload);
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
        });
        it('should add a keyword to the keyword list', function() {
            expect(component.createRecordForm.controls['keywords'].value.length).toBe(0);
            const inputElement: HTMLElement = element.query(By.css('input')).nativeElement;
            component.add({
                input: inputElement,
                value: 'keyword1',
            } as MatChipInputEvent);

            expect(component.createRecordForm.controls['keywords'].value.length).toBe(1);
            expect(component.createRecordForm.controls['keywords'].value).toContain('keyword1');
        });
        it('should remove a keyword in the keyword list', function() {
            component.keywordControls.push(component['fb'].control(rdfUpload.keywords[0]));

            expect(component.createRecordForm.controls['keywords'].value.length).toBe(1);
            expect(component.createRecordForm.controls['keywords'].value).toContain('keyword1');
            component.remove(rdfUpload.keywords[0]);

            expect(component.createRecordForm.controls['keywords'].value.length).toBe(0);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('.new-shapes-graph-record-modal')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('file-input')).length).toEqual(1);
        });
        it('when there is an error', async function() {
            let errorDisplay = element.queryAll(By.css('error-display'));
            expect(errorDisplay.length).toEqual(0);

            component.error = {'errorMessage': 'error', 'errorDetails': []};
            fixture.detectChanges();
            await fixture.whenStable();
            errorDisplay = element.queryAll(By.css('error-display'));

            expect(errorDisplay.length).toBe(1);
            expect(errorDisplay[0].nativeElement.innerText).toEqual('error');
            expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
            expect(matDialogRef.close).not.toHaveBeenCalled();
        });
        it('with fields for record details',  function() {
            const formFields = element.queryAll(By.css('mat-form-field'));

            expect(formFields.length).toEqual(3);
            expect(element.queryAll(By.css('input[matInput]')).length).toEqual(1);
            expect(element.queryAll(By.css('textarea')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-chip-list')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call add when the submit button is clicked', function() {
        spyOn(component, 'create');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.create).toHaveBeenCalled();
    });
});
