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
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { SerializationSelectComponent } from '../serializationSelect/serializationSelect.component';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyRecordDisplay } from '../openOntologyTab/openOntologyTab.component';
import { OntologyDownloadModalComponent } from './ontology-download-modal.component';

describe('OntologyDownloadModalComponent', function() {
    let component: OntologyDownloadModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyDownloadModalComponent>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<OntologyDownloadModalComponent>>;

    const recordId = 'urn:record';
    const displayItem: OntologyRecordDisplay = {
        title: 'This \\is$#?~() a <>{}&*Title',
        ontologyIRI: '',
        description: '',
        jsonld: { '@id': recordId}
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatDialogModule,
                MatIconModule,
                FormsModule,
                ReactiveFormsModule,
            ],
            declarations: [
                OntologyDownloadModalComponent,
                MockComponent(SerializationSelectComponent)
            ],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { record: displayItem } },
                MockProvider(OntologyManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OntologyDownloadModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<OntologyDownloadModalComponent>>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyManagerStub = null;
    });

    it('should initialize correctly', function() {
        expect(component.downloadForm.controls.serialization.value).toEqual('turtle');
    });
    describe('controller methods', function() {
        it('should download the ontology with the selected serialization', function() {
            component.download();
            expect(ontologyManagerStub.downloadOntology).toHaveBeenCalledWith(recordId, '', '', 'turtle', 'ThisisaTitle', false);
            expect(matDialogRef.close).toHaveBeenCalledWith();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a serialization-select', function() {
            expect(element.queryAll(By.css('serialization-select')).length).toEqual(1);
        });
        it('with buttons to close, close without saving, and cancel', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call download when the button is clicked', function() {
        spyOn(component, 'download');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        expect(component.download).toHaveBeenCalledWith();
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
});
