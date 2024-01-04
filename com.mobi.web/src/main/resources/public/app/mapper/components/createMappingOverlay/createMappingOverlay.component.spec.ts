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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { Difference } from '../../../shared/models/difference.class';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingRecord } from '../../../shared/models/mappingRecord.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { CreateMappingOverlayComponent } from './createMappingOverlay.component';

describe('Create Mapping Overlay component', function() {
    let component: CreateMappingOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateMappingOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateMappingOverlayComponent>>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;

    const id = 'mappingId';
    const record: MappingRecord = {
        title: 'Title',
        description: 'Description',
        keywords: ['A', 'B'],
        modified: '',
        id: 'id',
        branch: ''
    };
    let mappingStub: jasmine.SpyObj<Mapping>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatDialogModule,
                MatButtonModule,
                MatInputModule,
                MatFormFieldModule,
                MatChipsModule,
                MatIconModule
            ],
            declarations: [
                CreateMappingOverlayComponent,
                MockComponent(KeywordSelectComponent)
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(MappingManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateMappingOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        mappingManagerStub = TestBed.inject(MappingManagerService) as jasmine.SpyObj<MappingManagerService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateMappingOverlayComponent>>;

        mappingStub = jasmine.createSpyObj('Mapping', [
            'copy',
            'getJsonld'
        ]);
        mapperStateStub.selected = {
            mapping: undefined,
            difference: new Difference()
        };
        mapperStateStub.selectMappingStep = 0;
        mapperStateStub.fileUploadStep = 1;
        mapperStateStub.step = mapperStateStub.selectMappingStep;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mapperStateStub = null;
        mappingManagerStub = null;
        mappingStub = null;
    });

    describe('should initialize correctly', function() {
        it('if a previous mapping was selected', function() {
            mapperStateStub.selected.record = record;
            component.ngOnInit();
            expect(component.createMappingForm.controls.title.value).toEqual(record.title);
            expect(component.createMappingForm.controls.description.value).toEqual(record.description);
            expect(component.createMappingForm.controls.keywords.value).toEqual(record.keywords);
        });
        it('if a brand new mapping should be made', function() {
            component.ngOnInit();
            expect(component.createMappingForm.controls.title.value).toEqual('');
            expect(component.createMappingForm.controls.description.value).toEqual('');
            expect(component.createMappingForm.controls.keywords.value).toEqual([]);
        });
    });
    describe('controller methods', function() {
        describe('should set the correct state for continuing', function() {
            beforeEach(function() {
                mappingManagerStub.getMappingId.and.returnValue(id);
                component.createMappingForm.controls.title.setValue(record.title);
                component.createMappingForm.controls.description.setValue(record.description);
                component.createMappingForm.controls.keywords.setValue(record.keywords);
            });
            it('if a brand new mapping is being created', function() {
                component.continue();
                expect(mapperStateStub.selected.config).toEqual({
                    title: record.title,
                    description: record.description,
                    keywords: record.keywords
                });
                expect(mappingManagerStub.getMappingId).toHaveBeenCalledWith(record.title);
                expect(mapperStateStub.selected.mapping).toBeDefined();
                expect(mappingStub.copy).not.toHaveBeenCalled();
                expect(mapperStateStub.selected.difference.additions.length).toBeGreaterThan(0);
                expect(mapperStateStub.step).toEqual(mapperStateStub.fileUploadStep);
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            it('if a copy of a mapping is being created', function() {
                mapperStateStub.selected.mapping = mappingStub;
                mappingStub.copy.and.returnValue(mappingStub);
                mappingStub.getJsonld.and.returnValue([{'@id': 'test'}]);
                component.continue();
                expect(mapperStateStub.selected.config).toEqual({
                    title: record.title,
                    description: record.description,
                    keywords: record.keywords
                });
                expect(mappingManagerStub.getMappingId).toHaveBeenCalledWith(record.title);
                expect(mappingStub.copy).toHaveBeenCalledWith(id);
                expect(mapperStateStub.selected.mapping).toEqual(mappingStub);
                expect(mapperStateStub.selected.difference.additions.length).toBeGreaterThan(0);
                expect(mapperStateStub.step).toEqual(mapperStateStub.fileUploadStep);
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
        });
        it('should set the correct state for canceling', function() {
            component.cancel();
            expect(mapperStateStub.editMapping).toEqual(false);
            expect(mapperStateStub.newMapping).toEqual(false);
            expect(mapperStateStub.selected).toBeUndefined();
            expect(matDialogRef.close).toHaveBeenCalledWith();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="title"]', 'textarea', 'keyword-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with a mat-form-fields', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(2);
        });
        it('depending on the validity of the form', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.createMappingForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.createMappingForm.controls.title.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(component, 'cancel');
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(component.cancel).toHaveBeenCalledWith();
    });
    it('should call continue when the button is clicked', function() {
        spyOn(component, 'continue');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.continue).toHaveBeenCalledWith();
    });
});
