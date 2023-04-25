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
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { forEach } from 'lodash';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CATALOG, DATASET, ONTOLOGYEDITOR } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { Dataset } from '../../../shared/models/dataset.interface';
import { Repository } from '../../../shared/models/repository.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { DatasetsOntologyPickerComponent } from '../datasetsOntologyPicker/datasetsOntologyPicker.component';
import { EditDatasetOverlayComponent } from './editDatasetOverlay.component';

describe('Edit Dataset Overlay component', function() {
    let component: EditDatasetOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditDatasetOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<EditDatasetOverlayComponent>>;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
    let datasetStateStub: jasmine.SpyObj<DatasetStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let repositoryManagerStub: jasmine.SpyObj<RepositoryManagerService>;

    const catalogId = 'catalog';
    const recordId = 'recordId';
    const ontologyRecordId1 = 'ontologyRecordId1';
    const ontologyRecordId2 = 'ontologyRecordId2';
    const bnodeId = 'http://mobi.com/.well-known/genid/1234';
    const record = {'@id': recordId};
    const dataset: Dataset = { record, identifiers: [{'@id': 'bnode1'}, {'@id': 'bnode2'}]};
    const repo: Repository = {id: 'system', title: 'System Repository', type: 'native'};
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                MatChipsModule,
                MatIconModule,
                NoopAnimationsModule
            ],
            declarations: [
                EditDatasetOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(DatasetsOntologyPickerComponent),
                MockComponent(KeywordSelectComponent)
            ],
            providers: [
                MockProvider(DatasetManagerService),
                MockProvider(DatasetStateService),
                MockProvider(CatalogManagerService),
                MockProvider(RepositoryManagerService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        repositoryManagerStub = TestBed.inject(RepositoryManagerService) as jasmine.SpyObj<RepositoryManagerService>;
        repositoryManagerStub.getRepository.and.returnValue(of(repo));
        fixture = TestBed.createComponent(EditDatasetOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditDatasetOverlayComponent>>;
        datasetManagerStub = TestBed.inject(DatasetManagerService) as jasmine.SpyObj<DatasetManagerService>;
        datasetStateStub = TestBed.inject(DatasetStateService) as jasmine.SpyObj<DatasetStateService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        utilStub.getSkolemizedIRI.and.returnValue(bnodeId);
        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            switch (propertyIRI) {
                case DATASET + 'dataset':
                    return 'dataset';
                case DATASET + 'linksToRecord':
                    if (entity['@id'] ==='bnode1') {
                        return ontologyRecordId1;
                    } else {
                        return ontologyRecordId2;
                    }
                case CATALOG + 'head':
                    return 'commit';
                default:
                    return '';
            }
        });
        utilStub.getPropertyValue.and.returnValue('repository');
        utilStub.getDctermsValue.and.callFake((entity, property) => {
            switch (property) {
                case 'title':
                    return 'title';
                case 'description':
                    return 'description';
                default:
                    return '';
            }
        });
        record[CATALOG + 'keyword'] = [{'@value': 'A'}];
        catalogManagerStub.localCatalog = {'@id': catalogId};
        datasetStateStub.selectedDataset = Object.assign({}, dataset);
        catalogManagerStub.getRecord.and.callFake((id) => {
            if (id === ontologyRecordId1) {
                return of([{'@id': ontologyRecordId1}]);
            } else {
                return throwError('Error Message');
            }
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        datasetStateStub = null;
        datasetManagerStub = null;
        catalogManagerStub = null;
        utilStub = null;
    });
    
    it('should correctly initialize the form', fakeAsync(function() {
        spyOn(component, 'getOntologyIRI').and.returnValue('ontologyIRI');
        component.ngOnInit();
        tick();
        expect(component.catalogId).toEqual(catalogId);
        expect(component.datasetIRI).toEqual('dataset');
        expect(component.repositoryId).toEqual('repository');
        expect(component.editDatasetForm.controls.title.value).toEqual('title');
        expect(component.editDatasetForm.controls.description.value).toEqual('description');
        expect(component.editDatasetForm.controls.keywords.value).toEqual(['A']);
        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(ontologyRecordId1, catalogId);
        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(ontologyRecordId2, catalogId);
        expect(component.selectedOntologies).toEqual([{
            recordId: ontologyRecordId1,
            ontologyIRI: 'ontologyIRI',
            title: 'title',
            selected: true,
            jsonld: {'@id': ontologyRecordId1}
        }]);
    }));
    describe('controller methods', function() {
        it('should get the ontology IRI of an OntologyRecord', function() {
            utilStub.getPropertyId.and.returnValue('ontology');
            expect(component.getOntologyIRI(record)).toEqual('ontology');
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(record, ONTOLOGYEDITOR + 'ontologyIRI');
        });
        describe('should update a dataset', function() {
            beforeEach(function() {
                component.ngOnInit();
            });
            it('unless an error occurs', fakeAsync(function() {
                datasetManagerStub.updateDatasetRecord.and.callFake(() => throwError('Error Message'));
                component.update();
                tick();
                expect(datasetManagerStub.updateDatasetRecord).toHaveBeenCalledWith(recordId, catalogId, jasmine.any(Array));
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
                expect(component.error).toBe('Error Message');
            }));
            describe('successfully', function() {
                beforeEach(function() {
                    datasetManagerStub.updateDatasetRecord.and.callFake(() => of(null));
                });
                it('updating title, description, and keywords', fakeAsync(function() {
                    component.editDatasetForm.controls.title.setValue('new');
                    component.editDatasetForm.controls.description.setValue('new');
                    component.update();
                    tick();
                    expect(utilStub.updateDctermsValue).toHaveBeenCalledWith(jasmine.objectContaining({'@id': recordId}), 'title', 'new');
                    expect(utilStub.updateDctermsValue).toHaveBeenCalledWith(jasmine.objectContaining({'@id': recordId}), 'description', 'new');
                    forEach(component.editDatasetForm.controls.keywords.value, function(keyword) {
                        expect(utilStub.setPropertyValue).toHaveBeenCalledWith(jasmine.objectContaining({'@id': recordId}), CATALOG + 'keyword', keyword);
                    });
                    expect(datasetManagerStub.updateDatasetRecord).toHaveBeenCalledWith(recordId, catalogId, jasmine.any(Array));
                    expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    expect(component.error).toBe('');
                }));
                it('when all ontologies are removed.', fakeAsync(function() {
                    component.selectedOntologies = [];
                    component.update();
                    tick();
                    expect(datasetManagerStub.updateDatasetRecord).toHaveBeenCalledWith(recordId, catalogId, [{'@id': recordId, [CATALOG + 'keyword']: []}]);
                    expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    expect(component.error).toBe('');
                }));
                it('when an ontology is added.', fakeAsync(function() {
                    const branch = {'@id': 'branch'};
                    component.selectedOntologies = [{
                        recordId: 'newOntology',
                        ontologyIRI: 'ontologyIRI',
                        title: 'title',
                        selected: true,
                        jsonld: {'@id': 'newOntology'}
                    }];
                    catalogManagerStub.getRecordMasterBranch.and.callFake(() => of(branch));
                    const expectedBlankNode = {
                        '@id': bnodeId,
                        [DATASET + 'linksToRecord']: [{'@id': 'newOntology'}],
                        [DATASET + 'linksToBranch']: [{'@id': 'branch'}],
                        [DATASET + 'linksToCommit']: [{'@id': 'commit'}]
                    };
                    component.update();
                    tick();
                    expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith('newOntology', catalogId);
                    expect(utilStub.getSkolemizedIRI).toHaveBeenCalledWith();
                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
                    expect(utilStub.setPropertyId).toHaveBeenCalledWith(jasmine.objectContaining({'@id': recordId}), DATASET + 'ontology', jasmine.any(String));
                    expect(datasetManagerStub.updateDatasetRecord).toHaveBeenCalledWith(recordId, catalogId, [expectedBlankNode, {'@id': recordId, [CATALOG + 'keyword']: []}]);
                    expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    expect(component.error).toBe('');
                }));
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="title"]', 'textarea', 'keyword-select', '.dataset-info', 'datasets-ontology-picker'].forEach(test => {
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
            component.ngOnInit();
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.editDatasetForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.editDatasetForm.controls.title.setValue('test');
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
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call add when the button is clicked', function() {
        spyOn(component, 'update');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.update).toHaveBeenCalledWith();
    });
});
