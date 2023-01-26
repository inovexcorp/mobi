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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatButtonModule, MAT_DIALOG_DATA } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { MappingRecord } from '../../../shared/models/mappingRecord.interface';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { MapperSerializationSelectComponent } from '../mapperSerializationSelect/mapperSerializationSelect.component';
import { DownloadMappingOverlayComponent } from './downloadMappingOverlay.component';

describe('Download Mapping Overlay component', function() {
    let component: DownloadMappingOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DownloadMappingOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<DownloadMappingOverlayComponent>>;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;

    const data: MappingRecord = {
        title: 'Title',
        description: 'Description',
        keywords: ['A', 'B'],
        modified: '',
        id: 'id',
        branch: ''
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatDialogModule,
                MatButtonModule,
            ],
            declarations: [
                DownloadMappingOverlayComponent,
                MockComponent(MapperSerializationSelectComponent),
            ],
            providers: [
                MockProvider(MappingManagerService),
                { provide: MAT_DIALOG_DATA, useValue: {record: data} },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(DownloadMappingOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mappingManagerStub = TestBed.get(MappingManagerService);
        matDialogRef = TestBed.get(MatDialogRef);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mappingManagerStub = null;
    });

    it('should initialize correctly', function() {
        expect(component.downloadMappingForm.controls.serialization.value).toEqual('turtle');
    });
    describe('controller methods', function() {
        it('should download a mapping', function() {
            component.download();
            expect(mappingManagerStub.downloadMapping).toHaveBeenCalledWith(data.id, component.downloadMappingForm.controls.serialization.value);
            expect(matDialogRef.close).toHaveBeenCalledWith(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a mapper serialization select', function() {
            expect(element.queryAll(By.css('mapper-serialization-select')).length).toBe(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call download when the button is clicked', function() {
        spyOn(component, 'download');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.download).toHaveBeenCalledWith();
    });
});
