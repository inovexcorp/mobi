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
import { MatButtonModule, MatDialog, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatPaginatorModule, PageEvent } from '@angular/material';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';

import {
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { ViewMappingModalComponent } from '../viewMappingModal/viewMappingModal.component';
import { CreateMappingOverlayComponent } from '../createMappingOverlay/createMappingOverlay.component';
import { DownloadMappingOverlayComponent } from '../downloadMappingOverlay/downloadMappingOverlay.component';
import { CATALOG, DCTERMS, DELIM, POLICY, RDF } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MappingState } from '../../../shared/models/mappingState.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { Difference } from '../../../shared/models/difference.class';
import { MappingRecord } from '../../../shared/models/mappingRecord.interface';
import { MappingOntology } from '../../../shared/models/mappingOntology.interface';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../shared/services/util.service';
import { MappingSelectPageComponent } from './mappingSelectPage.component';

describe('Mapping Select Page component', function() {
    let component: MappingSelectPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MappingSelectPageComponent>;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const error = 'Error message';
    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const mappingId = 'mappingId';
    const branchId = 'branchId';
    const record: JSONLDObject = {
        '@id': recordId,
        [CATALOG + 'keyword']: [{
            '@value': 'keyword'
        }]
    };
    const mappingRecord: MappingRecord = {
        id: recordId,
        title: '',
        description: '',
        modified: '',
        keywords: [],
        branch: branchId
    };
    const mappingState: MappingState = {
        mapping: new Mapping(mappingId),
        difference: new Difference()
    };
    const mappingOntology: MappingOntology = {
        id: 'ontology',
        entities: []
    };
    const mappingClass: MappingClass = {
        name: '',
        classObj: {'@id': 'class'},
        isDeprecated: false,
        ontologyId: ''
    };
    const totalSize = 10;
    const headers = {'x-total-count': '' + totalSize};
     
    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatButtonModule,
                MatFormFieldModule,
                MatInputModule,
                MatMenuModule,
                MatPaginatorModule,
                MatDividerModule,
                MatIconModule
             ],
            declarations: [
                MappingSelectPageComponent,
                MockComponent(ViewMappingModalComponent),
                MockComponent(CreateMappingOverlayComponent),
                MockComponent(DownloadMappingOverlayComponent),
                MockComponent(ConfirmModalComponent),
                MockComponent(InfoMessageComponent),
                MockComponent(SearchBarComponent),
                MockPipe(HighlightTextPipe)
            ],
            providers: [
                MockProvider(MappingManagerService),
                MockProvider(MapperStateService),
                MockProvider(CatalogManagerService),
                MockProvider(ProgressSpinnerService),
                MockProvider(PolicyEnforcementService),
                MockProvider(UtilService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MappingSelectPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mappingManagerStub = TestBed.get(MappingManagerService);
        mapperStateStub = TestBed.get(MapperStateService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);
        policyEnforcementStub = TestBed.get(PolicyEnforcementService);
        utilStub = TestBed.get(UtilService);
        matDialog = TestBed.get(MatDialog);
        
        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [record], headers: new HttpHeaders(headers)})));
        mapperStateStub.paginationConfig = {
            limit: 10,
            pageIndex: 0,
            searchText: '',
            sortOption: {
                field: DCTERMS + 'title',
                label: 'Title',
                asc: true
            }
        };
        mapperStateStub.getClasses.and.returnValue([mappingClass]);
        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mappingManagerStub = null;
        mapperStateStub = null;
        catalogManagerStub = null;
        progressSpinnerStub = null;
        policyEnforcementStub = null;
        utilStub = null;
        matDialog = null;
    });

    describe('should correctly initialize', function() {
        beforeEach(function() {
            spyOn(component, 'setResults');
        });
        it('if a search was submitted', function() {
            component.ngOnInit();
            expect(component.searchText).toEqual('');
            expect(component.setResults).toHaveBeenCalledWith();
            expect(component.submittedSearch).toBeFalse();
        });
        it('if a search was submitted', function() {
            mapperStateStub.paginationConfig.searchText = 'test';
            component.ngOnInit();
            expect(component.searchText).toEqual('test');
            expect(component.setResults).toHaveBeenCalledWith();
            expect(component.submittedSearch).toBeTrue();
        });
    });
    describe('controller methods', function() {
        describe('should submit a search of records', function() {
            beforeEach(function() {
                spyOn(component, 'setResults');
            });
            it('with text', function() {
                component.searchText = 'test';
                component.searchRecords();
                expect(mapperStateStub.resetPagination).toHaveBeenCalledWith();
                expect(mapperStateStub.paginationConfig.searchText).toEqual(component.searchText);
                expect(component.setResults).toHaveBeenCalledWith();
                expect(component.submittedSearch).toBeTrue();
            });
            it('with no text', function() {
                component.searchRecords();
                expect(mapperStateStub.resetPagination).toHaveBeenCalledWith();
                expect(mapperStateStub.paginationConfig.searchText).toEqual('');
                expect(component.setResults).toHaveBeenCalledWith();
                expect(component.submittedSearch).toBeFalse();
            });
        });
        it('should get the specified page of mapping records', function() {
            spyOn(component, 'setResults');
            const event = new PageEvent();
            event.pageIndex = 10;
            component.getPage(event);
            expect(mapperStateStub.paginationConfig.pageIndex).toBe(10);
            expect(component.setResults).toHaveBeenCalledWith();
        });
        describe('should set the mapping results', function() {
            beforeEach(function() {
                utilStub.getDctermsValue.and.callFake((obj, prop) => prop);
                utilStub.getPropertyId.and.returnValue(branchId);
                utilStub.getDate.and.returnValue('Date');
            });
            it('successfully', fakeAsync(function() {
                component.setResults();
                tick();
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, mapperStateStub.paginationConfig);
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.mappingList);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.mappingList);
                expect(component.results).toEqual([{
                    id: recordId,
                    title: 'title',
                    description: 'description',
                    modified: 'Date',
                    keywords: ['keyword'],
                    branch: branchId
                }]);
                expect(mapperStateStub.totalSize).toEqual(totalSize);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecords.and.returnValue(throwError(error));
                component.setResults();
                tick();
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, mapperStateStub.paginationConfig);
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.mappingList);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.mappingList);
                expect(component.results).toEqual([]);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
        });
        it('should view a mapping', fakeAsync(function() {
            mapperStateStub.getMappingState.and.returnValue(of(mappingState));
            component.view(mappingRecord);
            tick();
            expect(mapperStateStub.getMappingState).toHaveBeenCalledWith(mappingRecord);
            expect(matDialog.open).toHaveBeenCalledWith(ViewMappingModalComponent, {data: {state: mappingState}});
        }));
        describe('should set the correct state for running a mapping', function() {
            beforeEach(function() {
                mapperStateStub.highlightIndexes = [];
                mapperStateStub.sourceOntologies = [];
                mapperStateStub.availableClasses = [];
            });
            it('successfully', fakeAsync(function() {
                const mappedColumns = ['A'];
                mapperStateStub.getMappedColumns.and.returnValue(mappedColumns);
                spyOn(component, 'setStateIfCompatible').and.returnValue(of([mappingOntology]));
                component.run(mappingRecord);
                tick();
                expect(mapperStateStub.getMappedColumns).toHaveBeenCalledWith();
                expect(mapperStateStub.highlightIndexes).toEqual(mappedColumns);
                expect(mapperStateStub.sourceOntologies).toEqual([mappingOntology]);
                expect(mapperStateStub.getClasses).toHaveBeenCalledWith([mappingOntology]);
                expect(mapperStateStub.availableClasses).toEqual([mappingClass]);
                expect(mapperStateStub.step).toEqual(mapperStateStub.fileUploadStep);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                spyOn(component, 'setStateIfCompatible').and.returnValue(throwError(error));
                component.run(mappingRecord);
                tick();
                expect(component.setStateIfCompatible).toHaveBeenCalledWith(mappingRecord);
                expect(mapperStateStub.getMappedColumns).not.toHaveBeenCalled();
                expect(mapperStateStub.highlightIndexes).toEqual([]);
                expect(mapperStateStub.sourceOntologies).toEqual([]);
                expect(mapperStateStub.getClasses).not.toHaveBeenCalled();
                expect(mapperStateStub.availableClasses).toEqual([]);
                expect(mapperStateStub.step).toBeUndefined();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        describe('should set the correct state for editing a mapping', function() {
            beforeEach(function() {
                mapperStateStub.editMapping = false;
                mapperStateStub.sourceOntologies = [];
                mapperStateStub.availableClasses = [];
            });
            it('if the user has permission', fakeAsync(function() {
                spyOn(component, 'setStateIfCompatible').and.returnValue(of([mappingOntology]));
                component.edit(mappingRecord);
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: CATALOG + 'Modify', actionAttrs: { [CATALOG + 'branch']: branchId}});
                expect(component.setStateIfCompatible).toHaveBeenCalledWith(mappingRecord);
                expect(mapperStateStub.editMapping).toEqual(true);
                expect(mapperStateStub.sourceOntologies).toEqual([mappingOntology]);
                expect(mapperStateStub.getClasses).toHaveBeenCalledWith([mappingOntology]);
                expect(mapperStateStub.availableClasses).toEqual([mappingClass]);
                expect(mapperStateStub.step).toEqual(mapperStateStub.fileUploadStep);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless the user does not have permission', fakeAsync(function() {
                spyOn(component, 'setStateIfCompatible').and.returnValue(of([mappingOntology]));
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                component.edit(mappingRecord);
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: CATALOG + 'Modify', actionAttrs: { [CATALOG + 'branch']: branchId}});
                expect(component.setStateIfCompatible).not.toHaveBeenCalled();
                expect(mapperStateStub.editMapping).toEqual(false);
                expect(mapperStateStub.sourceOntologies).toEqual([]);
                expect(mapperStateStub.getClasses).not.toHaveBeenCalled();
                expect(mapperStateStub.availableClasses).toEqual([]);
                expect(mapperStateStub.step).toBeUndefined();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
            it('unless an error occurs', fakeAsync(function() {
                spyOn(component, 'setStateIfCompatible').and.returnValue(throwError(error));
                component.edit(mappingRecord);
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: CATALOG + 'Modify', actionAttrs: { [CATALOG + 'branch']: branchId}});
                expect(component.setStateIfCompatible).toHaveBeenCalledWith(mappingRecord);
                expect(mapperStateStub.editMapping).toEqual(false);
                expect(mapperStateStub.sourceOntologies).toEqual([]);
                expect(mapperStateStub.getClasses).not.toHaveBeenCalled();
                expect(mapperStateStub.availableClasses).toEqual([]);
                expect(mapperStateStub.step).toBeUndefined();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        describe('should set the correct state for creating a new mapping', function() {
            it('if the user has permission', fakeAsync(function() {
                component.showNew();
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: catalogId, actionId: POLICY + 'Create', actionAttrs: { [RDF + 'type']: DELIM + 'MappingRecord'}});
                expect(mapperStateStub.startCreateMapping).toHaveBeenCalledWith();
                expect(mapperStateStub.selected).toEqual({mapping: undefined, difference: jasmine.any(Difference)});
                expect(matDialog.open).toHaveBeenCalledWith(CreateMappingOverlayComponent);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless the user does not have permission', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                component.showNew();
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: catalogId, actionId: POLICY + 'Create', actionAttrs: { [RDF + 'type']: DELIM + 'MappingRecord'}});
                expect(mapperStateStub.startCreateMapping).not.toHaveBeenCalled();
                expect(mapperStateStub.selected).toBeUndefined();
                expect(matDialog.open).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        describe('should set the correct state for deleting a mapping', function() {
            beforeEach(function() {
                spyOn(component, 'deleteMapping');
            });
            it('if the user has permission', fakeAsync(function() {
                component.confirmDeleteMapping(mappingRecord);
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: POLICY + 'Delete'});
                expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.any(String)}});
                expect(component.deleteMapping).toHaveBeenCalledWith(mappingRecord);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless the user does not have permission', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                component.confirmDeleteMapping(mappingRecord);
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: POLICY + 'Delete'});
                expect(matDialog.open).not.toHaveBeenCalled();
                expect(component.deleteMapping).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        it('should open the downloadMappingOverlay', function() {
            component.download(mappingRecord);
            expect(matDialog.open).toHaveBeenCalledWith(DownloadMappingOverlayComponent, {data: {record: mappingRecord}});
        });
        describe('should set the correct state for duplicating a mapping', function() {
            it('if the user has permission', fakeAsync(function() {
                spyOn(component, 'setStateIfCompatible').and.returnValue(of([mappingOntology]));
                component.duplicate(mappingRecord);
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: catalogId, actionId: POLICY + 'Create', actionAttrs: { [RDF + 'type']: DELIM + 'MappingRecord'}});
                expect(component.setStateIfCompatible).toHaveBeenCalledWith(mappingRecord);
                expect(mapperStateStub.startCreateMapping).toHaveBeenCalledWith();
                expect(matDialog.open).toHaveBeenCalledWith(CreateMappingOverlayComponent);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless the user does not have permission', fakeAsync(function() {
                spyOn(component, 'setStateIfCompatible').and.returnValue(of([mappingOntology]));
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                component.duplicate(mappingRecord);
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: catalogId, actionId: POLICY + 'Create', actionAttrs: { [RDF + 'type']: DELIM + 'MappingRecord'}});
                expect(component.setStateIfCompatible).not.toHaveBeenCalled();
                expect(mapperStateStub.startCreateMapping).not.toHaveBeenCalled();
                expect(matDialog.open).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
            it('unless an error occurs', fakeAsync(function() {
                spyOn(component, 'setStateIfCompatible').and.returnValue(throwError(error));
                component.duplicate(mappingRecord);
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: catalogId, actionId: POLICY + 'Create', actionAttrs: { [RDF + 'type']: DELIM + 'MappingRecord'}});
                expect(component.setStateIfCompatible).toHaveBeenCalledWith(mappingRecord);
                expect(mapperStateStub.startCreateMapping).not.toHaveBeenCalled();
                expect(matDialog.open).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        describe('should delete a mapping', function() {
            beforeEach(function() {
                spyOn(component, 'setResults');
            });
            it('successfully', fakeAsync(function() {
                mappingManagerStub.deleteMapping.and.returnValue(of(null));
                component.deleteMapping(mappingRecord);
                tick();
                expect(mapperStateStub.resetPagination).toHaveBeenCalledWith();
                expect(component.setResults).toHaveBeenCalledWith();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                mappingManagerStub.deleteMapping.and.returnValue(throwError(error));
                component.deleteMapping(mappingRecord);
                tick();
                expect(mapperStateStub.resetPagination).not.toHaveBeenCalled();
                expect(component.setResults).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        describe('should set the selected mapping', function() {
            beforeEach(function() {
                mapperStateStub.getMappingState.and.returnValue(of(mappingState));
            });
            it('unless getting the mapping state throws an error', fakeAsync(function() {
                mapperStateStub.getMappingState.and.returnValue(throwError(error));
                component.setStateIfCompatible(mappingRecord)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                    });
                tick();
                expect(mappingManagerStub.getSourceOntologies).not.toHaveBeenCalled();
                expect(mappingManagerStub.areCompatible).not.toHaveBeenCalled();
                expect(mapperStateStub.selected).toBeUndefined();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless getting the source ontologies throws an error', fakeAsync(function() {
                mappingManagerStub.getSourceOntologies.and.returnValue(throwError(error));
                component.setStateIfCompatible(mappingRecord)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                    });
                tick();
                expect(mappingManagerStub.getSourceOntologies).toHaveBeenCalledWith(mappingState.mapping.getSourceOntologyInfo());
                expect(mappingManagerStub.areCompatible).not.toHaveBeenCalled();
                expect(mapperStateStub.selected).toBeUndefined();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless the mapping is not compatible with the source ontologies', fakeAsync(function() {
                mappingManagerStub.getSourceOntologies.and.returnValue(of([mappingOntology]));
                mappingManagerStub.areCompatible.and.returnValue(false);
                component.setStateIfCompatible(mappingRecord)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(null);
                    });
                tick();
                expect(mappingManagerStub.getSourceOntologies).toHaveBeenCalledWith(mappingState.mapping.getSourceOntologyInfo());
                expect(mappingManagerStub.areCompatible).toHaveBeenCalledWith(mappingState.mapping, [mappingOntology]);
                expect(mapperStateStub.selected).toBeUndefined();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String), {timeOut: jasmine.any(Number)});
            }));
            it('successfully', fakeAsync(function() {
                mappingManagerStub.getSourceOntologies.and.returnValue(of([mappingOntology]));
                mappingManagerStub.areCompatible.and.returnValue(true);
                component.setStateIfCompatible(mappingRecord)
                    .subscribe(response => {
                        expect(response).toEqual([mappingOntology]);
                    }, () => fail('Observable should have resolved'));
                tick();
                expect(mappingManagerStub.getSourceOntologies).toHaveBeenCalledWith(mappingState.mapping.getSourceOntologyInfo());
                expect(mappingManagerStub.areCompatible).toHaveBeenCalledWith(mappingState.mapping, [mappingOntology]);
                expect(mapperStateStub.selected).toEqual(mappingState);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: []})));
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.mapping-select-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-lg-8')).length).toEqual(1);
        });
        ['search-bar', 'mat-paginator', 'button.new-button', '.results-list'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on how many mappings there are', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.results-list info-message')).length).toBe(1);
            expect(element.queryAll(By.css('.results-list .mapping')).length).toBe(0);
            expect(element.queryAll(By.css('.results-list .menu-button')).length).toBe(0);

            component.results = [mappingRecord];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.results-list info-message')).length).toBe(0);
            expect(element.queryAll(By.css('.results-list .mapping')).length).toBe(1);
            expect(element.queryAll(By.css('.results-list .menu-button')).length).toBe(1);
        });
        it('depending on whether a search has been submitted', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.results-list info-message.no-results')).length).toBe(1);
            expect(element.queryAll(By.css('.results-list info-message.no-match')).length).toBe(0);

            component.submittedSearch = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.results-list info-message.no-results')).length).toBe(0);
            expect(element.queryAll(By.css('.results-list info-message.no-match')).length).toBe(1);
        });
        it('should call showNew when the button is clicked', function() {
            spyOn(component, 'showNew');
            const button = element.queryAll(By.css('button.new-button'))[0];
            button.triggerEventHandler('click', null);
            expect(component.showNew).toHaveBeenCalledWith();
        });
    });
    describe('menu button', function() {
        beforeEach(function() {
            spyOn(component, 'setResults');
            component.results = [mappingRecord];
            fixture.detectChanges();
            const menuButton = element.queryAll(By.css('button.menu-button'))[0];
            menuButton.triggerEventHandler('click', null);
        });
        it('should call view', function() {
            spyOn(component, 'view');
            const button = element.queryAll(By.css('.mat-menu-panel button.preview-mapping'))[0];
            button.triggerEventHandler('click', null);
            expect(component.view).toHaveBeenCalledWith(mappingRecord);
        });
        it('should call duplicate', function() {
            spyOn(component, 'duplicate');
            const button = element.queryAll(By.css('.mat-menu-panel button.duplicate-mapping'))[0];
            button.triggerEventHandler('click', null);
            expect(component.duplicate).toHaveBeenCalledWith(mappingRecord);
        });
        it('should call edit', function() {
            spyOn(component, 'edit');
            const button = element.queryAll(By.css('.mat-menu-panel button.edit-mapping'))[0];
            button.triggerEventHandler('click', null);
            expect(component.edit).toHaveBeenCalledWith(mappingRecord);
        });
        it('should call run', function() {
            spyOn(component, 'run');
            const button = element.queryAll(By.css('.mat-menu-panel button.run-mapping'))[0];
            button.triggerEventHandler('click', null);
            expect(component.run).toHaveBeenCalledWith(mappingRecord);
        });
        it('should call download', function() {
            spyOn(component, 'download');
            const button = element.queryAll(By.css('.mat-menu-panel button.download-mapping'))[0];
            button.triggerEventHandler('click', null);
            expect(component.download).toHaveBeenCalledWith(mappingRecord);
        });
        it('should call confirmDeleteMapping', function() {
            spyOn(component, 'confirmDeleteMapping');
            const button = element.queryAll(By.css('.mat-menu-panel button.delete-mapping'))[0];
            button.triggerEventHandler('click', null);
            expect(component.confirmDeleteMapping).toHaveBeenCalledWith(mappingRecord);
        });
    });
});