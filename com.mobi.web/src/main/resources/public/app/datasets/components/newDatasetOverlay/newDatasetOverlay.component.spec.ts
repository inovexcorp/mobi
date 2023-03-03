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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { DatasetsOntologyPickerComponent } from '../datasetsOntologyPicker/datasetsOntologyPicker.component';
import { NewDatasetOverlayComponent } from './newDatasetOverlay.component';

describe('New Dataset Overlay component', function() {
    let component: NewDatasetOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<NewDatasetOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<NewDatasetOverlayComponent>>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let repositoryManagerStub: jasmine.SpyObj<RepositoryManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                MatChipsModule,
                MatSelectModule,
                MatIconModule,
                NoopAnimationsModule
            ],
            declarations: [
                NewDatasetOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(DatasetsOntologyPickerComponent),
                MockComponent(KeywordSelectComponent)
            ],
            providers: [
                MockProvider(DatasetManagerService),
                MockProvider(UtilService),
                MockProvider(RepositoryManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        repositoryManagerStub = TestBed.inject(RepositoryManagerService) as jasmine.SpyObj<RepositoryManagerService>;
        repositoryManagerStub.getRepositories.and.returnValue(of([]));
        fixture = TestBed.createComponent(NewDatasetOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<NewDatasetOverlayComponent>>;
        datasetManagerStub = TestBed.inject(DatasetManagerService) as jasmine.SpyObj<DatasetManagerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        datasetManagerStub = null;
        utilStub = null;
        repositoryManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should create a dataset', function() {
            beforeEach(function() {
                component.createDatasetForm.setValue({
                    title: 'title',
                    description: 'description',
                    datasetIRI: 'datasetIRI',
                    repository: 'system',
                    keywords: ['a ', ' b', 'c d']
                });
                component.selectedOntologies = [
                    {
                        recordId: 'ontology1',
                        ontologyIRI: '',
                        title: '',
                        selected: true,
                        jsonld: {'@id': 'ontology1'}
                    },
                    {
                        recordId: 'ontology2',
                        ontologyIRI: '',
                        title: '',
                        selected: true,
                        jsonld: {'@id': 'ontology2'}
                    }
                ];
            });
            it('unless an error occurs', fakeAsync(function() {
                datasetManagerStub.createDatasetRecord.and.callFake(() => throwError('Error Message'));
                component.create();
                tick();
                expect(datasetManagerStub.createDatasetRecord).toHaveBeenCalledWith({
                    title: 'title',
                    description: 'description',
                    repositoryId: 'system',
                    datasetIRI: 'datasetIRI',
                    keywords: ['a', 'b', 'c d'],
                    ontologies: ['ontology1', 'ontology2']
                });
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
                expect(component.error).toBe('Error Message');
            }));
            it('successfully', fakeAsync(function() {
                datasetManagerStub.createDatasetRecord.and.callFake(() => of(null));
                component.create();
                tick();
                expect(datasetManagerStub.createDatasetRecord).toHaveBeenCalledWith({
                    title: 'title',
                    description: 'description',
                    repositoryId: 'system',
                    datasetIRI: 'datasetIRI',
                    keywords: ['a', 'b', 'c d'],
                    ontologies: ['ontology1', 'ontology2']
                });
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith(true);
                expect(component.error).toBe('');
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="title"]', 'input[name="datasetIRI"]', 'textarea', 'keyword-select', 'mat-select', 'datasets-ontology-picker'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.error = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on the validity of the form', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.createDatasetForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.createDatasetForm.controls.title.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether the dataset iri is valid', function() {
            expect(element.queryAll(By.css('mat-error')).length).toEqual(0);

            component.createDatasetForm.controls.datasetIRI.setValue('test');
            component.createDatasetForm.controls.datasetIRI.markAsTouched();
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-error')).length).toEqual(1);
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
    it('should call create when the button is clicked', function() {
        spyOn(component, 'create');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.create).toHaveBeenCalledWith();
    });
});
