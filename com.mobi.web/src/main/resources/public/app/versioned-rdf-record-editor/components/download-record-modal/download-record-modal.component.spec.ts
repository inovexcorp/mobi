/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent } from 'ng-mocks';

import { MockVersionedRdfState, cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { stateServiceToken } from '../../../shared/injection-token';
import { SerializationSelectComponent } from '../../../shared/components/serializationSelect/serializationSelect.component';
import { DownloadRecordModalComponent } from './download-record-modal.component';

describe('Download Record Modal component', function() {
    let component: DownloadRecordModalComponent<VersionedRdfListItem>;
    let element: DebugElement;
    let fixture: ComponentFixture<DownloadRecordModalComponent<VersionedRdfListItem>>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<DownloadRecordModalComponent<VersionedRdfListItem>>>;
    let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    const recordId = 'urn:record';
    const branchId = 'urn:branch';
    const commitId = 'urn:commit';
    const data = {
        recordId,
        branchId,
        commitId,
        title: 'title'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule
            ],
            declarations: [
                DownloadRecordModalComponent,
                MockComponent(SerializationSelectComponent)
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: stateServiceToken, useClass: MockVersionedRdfState },
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(DownloadRecordModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DownloadRecordModalComponent<VersionedRdfListItem>>>;
        stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        stateStub = null;
    });

    describe('controller methods', function() {
        it('should download and close the dialog', function() {
            component.downloadRecordForm.controls['serialization'].setValue('turtle');
            component.downloadRecordForm.controls['fileName'].setValue('filename.ttl');
            component.download();
            expect(stateStub.download).toHaveBeenCalledWith({
                recordId,
                branchId,
                commitId,
                rdfFormat: 'turtle',
                fileName: 'filename.ttl',
                applyInProgressCommit: true
            });
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(1);
            expect(element.queryAll(By.css('serialization-select')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call add when the submit button is clicked', function() {
        spyOn(component, 'download');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.download).toHaveBeenCalledWith();
    });
});
