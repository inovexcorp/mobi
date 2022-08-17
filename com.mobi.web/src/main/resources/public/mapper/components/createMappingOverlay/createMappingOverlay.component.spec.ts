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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatChipsModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { Difference } from '../../../shared/models/difference.class';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MappingOntology } from '../../../shared/models/mappingOntology.interface';
import { MappingOntologyInfo } from '../../../shared/models/mappingOntologyInfo.interface';
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

    const error = 'Error message';
    const id = 'mappingId';
    const record: MappingRecord = {
        title: 'Title',
        description: 'Description',
        keywords: ['A', 'B'],
        modified: '',
        id: 'id',
        branch: ''
    };
    const sourceOntologyInfo: MappingOntologyInfo = {
        recordId: 'recordId',
        branchId: 'branchId',
        commitId: 'commitId'
    };
    let mappingStub: jasmine.SpyObj<Mapping>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
                MockComponent(ErrorDisplayComponent),
                MockComponent(KeywordSelectComponent)
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(MappingManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CreateMappingOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.get(MapperStateService);
        mappingManagerStub = TestBed.get(MappingManagerService);
        matDialogRef = TestBed.get(MatDialogRef);

        mappingStub = jasmine.createSpyObj('Mapping', [
            'copy',
            'getSourceOntologyInfo',
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
                mapperStateStub.sourceOntologies = [];
                mapperStateStub.availableClasses = [];
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
                expect(mappingStub.getSourceOntologyInfo).not.toHaveBeenCalled();
                expect(mappingManagerStub.getSourceOntologies).not.toHaveBeenCalled();
                expect(mapperStateStub.sourceOntologies).toEqual([]);
                expect(mapperStateStub.availableClasses).toEqual([]);
                expect(component.errorMessage).toEqual('');
                expect(mapperStateStub.selected.difference.additions.length).toBeGreaterThan(0);
                expect(mapperStateStub.step).toEqual(mapperStateStub.fileUploadStep);
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            describe('if a copy of a mapping is being created', function() {
                beforeEach(function() {
                    mapperStateStub.selected.mapping = mappingStub;
                    mappingStub.copy.and.returnValue(mappingStub);
                    mappingStub.getSourceOntologyInfo.and.returnValue(sourceOntologyInfo);
                    mappingStub.getJsonld.and.returnValue([{'@id': 'test'}]);
                });
                it('unless getSourceOntologies is rejected', fakeAsync(function() {
                    mappingManagerStub.getSourceOntologies.and.returnValue(throwError(error));
                    component.continue();
                    tick();
                    expect(mapperStateStub.selected.config).toEqual({
                        title: record.title,
                        description: record.description,
                        keywords: record.keywords
                    });
                    expect(mappingManagerStub.getMappingId).toHaveBeenCalledWith(record.title);
                    expect(mappingStub.copy).toHaveBeenCalledWith(id);
                    expect(mapperStateStub.selected.mapping).toEqual(mappingStub);
                    expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                    expect(mappingManagerStub.getSourceOntologies).toHaveBeenCalledWith(sourceOntologyInfo);
                    expect(mapperStateStub.sourceOntologies).toEqual([]);
                    expect(mapperStateStub.availableClasses).toEqual([]);
                    expect(component.errorMessage).toEqual(jasmine.any(String));
                    expect(mapperStateStub.selected.difference.additions.length).toEqual(0);
                    expect(mapperStateStub.step).toEqual(mapperStateStub.selectMappingStep);
                    expect(matDialogRef.close).not.toHaveBeenCalled();
                }));
                it('successfully', fakeAsync(function() {
                    const ontologies: MappingOntology[] = [{
                        id: '',
                        entities: []
                    }];
                    const classes: MappingClass[] = [{
                        name: '',
                        classObj: {'@id': 'classId'},
                        isDeprecated: false,
                        ontologyId: ''
                    }];
                    mappingManagerStub.getSourceOntologies.and.returnValue(of(ontologies));
                    mapperStateStub.getClasses.and.returnValue(classes);
                    component.continue();
                    tick();
                    expect(mapperStateStub.selected.config).toEqual({
                        title: record.title,
                        description: record.description,
                        keywords: record.keywords
                    });
                    expect(mappingManagerStub.getMappingId).toHaveBeenCalledWith(record.title);
                    expect(mappingStub.copy).toHaveBeenCalledWith(id);
                    expect(mapperStateStub.selected.mapping).toEqual(mappingStub);
                    expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                    expect(mappingManagerStub.getSourceOntologies).toHaveBeenCalledWith(sourceOntologyInfo);
                    expect(mapperStateStub.sourceOntologies).toEqual(ontologies);
                    expect(mapperStateStub.availableClasses).toEqual(classes);
                    expect(component.errorMessage).toEqual('');
                    expect(mapperStateStub.selected.difference.additions.length).toBeGreaterThan(0);
                    expect(mapperStateStub.step).toEqual(mapperStateStub.fileUploadStep);
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                }));
            });
        });
        it('should set the correct state for canceling', function() {
            component.cancel();
            expect(mapperStateStub.editMapping).toEqual(false);
            expect(mapperStateStub.newMapping).toEqual(false);
            expect(mapperStateStub.selected).toBeUndefined();
            expect(mapperStateStub.sourceOntologies).toEqual([]);
            expect(mapperStateStub.availableClasses).toEqual([]);
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
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.errorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
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
        cancelButton.triggerEventHandler('click', null);
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
