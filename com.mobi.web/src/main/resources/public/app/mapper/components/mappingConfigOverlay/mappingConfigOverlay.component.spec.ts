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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CATALOG, DCTERMS, DELIM, ONTOLOGYEDITOR } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { LimitDescriptionComponent } from '../../../shared/components/limitDescription/limitDescription.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MappingOntology } from '../../../shared/models/mappingOntology.interface';
import { MappingOntologyInfo } from '../../../shared/models/mappingOntologyInfo.interface';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { UtilService } from '../../../shared/services/util.service';
import { MappingConfigOverlayComponent } from './mappingConfigOverlay.component';

describe('Mapping Config Overlay component', function() {
    let component: MappingConfigOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MappingConfigOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<MappingConfigOverlayComponent>>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const error = 'Error Message';
    const mappingId = 'mappingId';
    const catalogId = 'catalogId';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const ontologyIRI = 'ontologyIRI';
    const sortOption: SortOption = {field: DCTERMS + 'title', asc: true, label: ''};
    const branch: JSONLDObject = {'@id': branchId};
    const ontologyRecord: JSONLDObject = {'@id': 'ont1'};
    const ontologyInfo: MappingOntologyInfo = {
        recordId: ontologyRecord['@id'],
        branchId,
        commitId
    };
    const originalClassObj: JSONLDObject = {'@id': 'original'};
    const importedClassObj: JSONLDObject = {'@id': 'imported'};
    const originalOntology: MappingOntology = {id: 'original', entities: [originalClassObj]};
    const importedOntology: MappingOntology = {id: 'imported', entities: [importedClassObj]};
    const mappingClass: MappingClass = {
        name: '',
        isDeprecated: false,
        ontologyId: '',
        classObj: originalClassObj
    };
    const selectedOntology = {
        jsonld: ontologyRecord,
        recordId: ontologyRecord['@id'],
        ontologyIRI,
        title: '',
        description: '',
        modified: '',
        selected: false
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
                MatFormFieldModule,
                MatInputModule,
                MatListModule,
                MatSelectModule
            ],
            declarations: [
                MappingConfigOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(LimitDescriptionComponent),
                MockComponent(InfoMessageComponent),
                MockComponent(SearchBarComponent)
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(MappingManagerService),
                MockProvider(CatalogManagerService),
                MockProvider(ProgressSpinnerService),
                MockProvider(OntologyManagerService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.sortOptions = [sortOption];
       
        fixture = TestBed.createComponent(MappingConfigOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        mappingManagerStub = TestBed.inject(MappingManagerService) as jasmine.SpyObj<MappingManagerService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<MappingConfigOverlayComponent>>;

        mappingStub = jasmine.createSpyObj('Mapping', [
            'getSourceOntologyInfo',
            'getJsonld',
            'findClassWithDataMapping',
            'findClassWithObjectMapping',
            'setSourceOntologyInfo',
            'getMappingEntity',
            'getAllClassMappings'
        ]);
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: []})));
        mapperStateStub.selected = {
            mapping: mappingStub,
            difference: new Difference(),
            config: {
                title: 'title',
                description: '',
            }
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mapperStateStub = null;
        mappingManagerStub = null;
        catalogManagerStub = null;
        ontologyManagerStub = null;
        utilStub = null;
        mappingStub = null;
    });

    describe('should initialize with the correct values', function() {
        beforeEach(function() {
            spyOn(component, 'setOntologies');
        });
        it('for the configuration for getting ontology records', function() {
            expect(component.recordsConfig.pageIndex).toEqual(0);
            expect(component.recordsConfig.sortOption).toEqual(sortOption);
            expect(component.recordsConfig.type).toEqual(ONTOLOGYEDITOR + 'OntologyRecord');
            expect(component.recordsConfig.limit).toEqual(100);
            expect(component.recordsConfig.searchText).toEqual('');
        });
        it('if the mapping does not have an ontology set', function() {
            component.ngOnInit();
            expect(component.selectedOntology).toBeUndefined();
            expect(component.ontologyStates).toEqual([]);
            expect(component.selectedVersion).toEqual('latest');
            expect(component.selectedOntologyState).toBeUndefined();
            expect(component.classes).toEqual([]);
            expect(catalogManagerStub.getRecordMasterBranch).not.toHaveBeenCalled();
            expect(component.setOntologies).toHaveBeenCalledWith();
        });
        describe('if the mapping had an ontology set', function() {
            beforeEach(function() {
                mapperStateStub.selected.ontology = ontologyRecord;
                spyOn(component, 'getOntologyIRI').and.returnValue(ontologyIRI);
                utilStub.getDctermsValue.and.callFake((obj, prop) => prop);
                utilStub.getDate.and.returnValue('date');
                mapperStateStub.sourceOntologies = [originalOntology];
                mapperStateStub.getClasses.and.returnValue([mappingClass]);
                mappingStub.getSourceOntologyInfo.and.returnValue(ontologyInfo);
                catalogManagerStub.getRecordMasterBranch.and.returnValue(of(branch));
            });
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecordMasterBranch.and.returnValue(throwError(error));
                component.ngOnInit();
                tick();
                expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(ontologyRecord['@id'], catalogId);
                expect(component.ontologyStates).toEqual([]);
                expect(component.classes).toEqual([]);
                expect(component.selectedOntologyState).toBeUndefined();
                expect(component.selectedOntology).toBeUndefined();
                expect(component.selectedVersion).toEqual('latest');
                expect(component.errorMessage).toEqual('Error retrieving ontology');
                expect(component.setOntologies).toHaveBeenCalledWith();
            }));
            it('and no changes have been committed to the ontology since it was set', fakeAsync(function() {
                utilStub.getPropertyId.and.returnValue(commitId);
                const expectedState = {
                    recordId: ontologyRecord['@id'],
                    branchId,
                    latest: {
                        commitId,
                        ontologies: [originalOntology],
                        classes: [mappingClass]
                    }
                };
                component.ngOnInit();
                tick();
                expect(component.selectedOntology).toEqual({
                    jsonld: ontologyRecord,
                    recordId: ontologyRecord['@id'],
                    ontologyIRI,
                    title: 'title',
                    description: 'description',
                    modified: 'date',
                    selected: true
                });
                expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(ontologyRecord['@id'], catalogId);
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
                expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                expect(component.ontologyStates).toContain(expectedState);
                expect(component.selectedOntologyState).toEqual(expectedState);
                expect(component.selectedVersion).toEqual('latest');
                expect(component.classes).toEqual([mappingClass]);
                expect(component.setOntologies).toHaveBeenCalledWith();
            }));
            it('and changes have been committed to the ontology since it was set', fakeAsync(function() {
                utilStub.getPropertyId.and.returnValue('otherCommit');
                const expectedState = {
                    recordId: ontologyRecord['@id'],
                    branchId,
                    saved: {
                        commitId,
                        ontologies: [originalOntology],
                        classes: [mappingClass]
                    },
                };
                component.ngOnInit();
                tick();
                expect(component.selectedOntology).toEqual({
                    jsonld: ontologyRecord,
                    recordId: ontologyRecord['@id'],
                    ontologyIRI,
                    title: 'title',
                    description: 'description',
                    modified: 'date',
                    selected: true
                });
                expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(ontologyRecord['@id'], catalogId);
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
                expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                expect(component.ontologyStates).toContain(expectedState);
                expect(component.selectedOntologyState).toEqual(expectedState);
                expect(component.selectedVersion).toEqual('saved');
                expect(component.classes).toEqual([mappingClass]);
            }));
        });
    });
    describe('controller methods', function() {
        it('should get the ontology IRI of an OntologyRecord', function() {
            utilStub.getPropertyId.and.returnValue('ontology');
            expect(component.getOntologyIRI(ontologyRecord)).toEqual('ontology');
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(ontologyRecord, ONTOLOGYEDITOR + 'ontologyIRI');
        });
        it('should handle changing of the ontology', function() {
            const event = {
                source: null,
                options: [{
                    value: selectedOntology
                }]
            } as MatSelectionListChange;
            spyOn(component, 'toggleOntology');
            component.ontologyChange(event);
            expect(component.toggleOntology).toHaveBeenCalledWith(selectedOntology);
        });
        describe('should set the list of ontology records', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
            });
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecords.and.returnValue(throwError(error));
                component.setOntologies();
                tick();
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.ontologyListBox);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.recordsConfig, true);
                expect(component.recordsErrorMessage).toEqual('Error retrieving ontologies');
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.ontologyListBox);
            }));
            describe('successfully', function() {
                beforeEach(function() {
                    this.otherRecord = {'@id': 'otherRecord'};
                    catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [ontologyRecord, this.otherRecord]})));
                    spyOn(component, 'getOntologyIRI').and.returnValue(ontologyIRI);
                    utilStub.getDctermsValue.and.callFake((obj, prop) => prop);
                    utilStub.getDate.and.returnValue('date');
                });
                it('if an ontology is selected', fakeAsync(function() {
                    component.setOntologies();
                    tick();
                    expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.ontologyListBox);
                    expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.recordsConfig, true);
                    expect(component.ontologies).toEqual([
                        {recordId: ontologyRecord['@id'], modified: 'date', ontologyIRI, title: 'title', description: 'description', selected: false, jsonld: ontologyRecord},
                        {recordId: this.otherRecord['@id'], modified: 'date', ontologyIRI, title: 'title', description: 'description', selected: false, jsonld: this.otherRecord}
                    ]);
                    expect(component.recordsErrorMessage).toEqual('');
                    expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.ontologyListBox);
                }));
                it('if an ontology is not selected', fakeAsync(function() {
                    component.selectedOntology = selectedOntology;
                    component.setOntologies();
                    tick();
                    expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.ontologyListBox);
                    expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.recordsConfig, true);
                    expect(component.ontologies).toEqual([
                        {recordId: ontologyRecord['@id'], modified: 'date', ontologyIRI, title: 'title', description: 'description', selected: true, jsonld: ontologyRecord},
                        {recordId: this.otherRecord['@id'], modified: 'date', ontologyIRI, title: 'title', description: 'description', selected: false, jsonld: this.otherRecord}
                    ]);
                    expect(component.recordsErrorMessage).toEqual('');
                    expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.ontologyListBox);
                }));
            });
        });
        describe('should toggle an ontology', function() {
            beforeEach(function() {
                spyOn(component, 'selectOntology');
            });
            it('if the ontology is now selected', function() {
                const ont = Object.assign({}, selectedOntology);
                const otherOnt = {
                    recordId: 'other',
                    modified: '',
                    description: '',
                    title: '',
                    jsonld: undefined,
                    ontologyIRI: '',
                    selected: true
                };
                component.ontologies = [ont, otherOnt];
                component.selectedOntology = ont;
                component.toggleOntology(ont);
                expect(ont.selected).toBeTrue();
                expect(otherOnt.selected).toBeFalse();
                expect(component.selectedOntology).toEqual(ont);
                expect(component.selectOntology).toHaveBeenCalledWith(ont);
            });
            it('if the ontology is now unselected', function() {
                const ont = Object.assign({}, selectedOntology);
                ont.selected = true;
                component.selectedOntology = ont;
                component.toggleOntology(ont);
                expect(ont.selected).toBeFalse();
                expect(component.selectedOntology).toBeUndefined();
                expect(component.selectedVersion).toEqual('latest');
                expect(component.selectedOntologyState).toBeUndefined();
                expect(component.classes).toEqual([]);
            });
        });
        describe('should select an ontology', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
             });
            it('unless it is already selected', function() {
                const openedState = {
                    recordId: selectedOntology.recordId,
                    latest: {
                        classes: [mappingClass]
                    }
                };
                component.ontologyStates.push(openedState);
                component.selectedOntologyState = openedState;
                component.selectOntology(selectedOntology);
                expect(component.selectedOntology).toEqual(selectedOntology);
                expect(component.selectedOntologyState).toEqual(openedState);
                expect(component.selectedVersion).toEqual('latest');
                expect(component.classes).toEqual([]);
                expect(component.errorMessage).toEqual('');
            });
            it('if it had been opened', function() {
                const openedState = {
                    recordId: selectedOntology.recordId,
                    latest: {
                        classes: [mappingClass]
                    }
                };
                component.ontologyStates.push(openedState);
                component.selectOntology(selectedOntology);
                expect(component.selectedOntology).toEqual(selectedOntology);
                expect(component.selectedOntologyState).toEqual(openedState);
                expect(component.selectedVersion).toEqual('latest');
                expect(component.classes).toEqual(openedState.latest.classes);
                expect(component.errorMessage).toEqual('');
            });
            describe('if it had not been opened', function() {
                it('unless an error occurs with getRecordMasterBranch', fakeAsync(function() {
                    catalogManagerStub.getRecordMasterBranch.and.returnValue(throwError(error));
                    component.selectOntology(selectedOntology);
                    tick();
                    expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(selectedOntology.recordId, catalogId);
                    expect(mappingManagerStub.getOntology).not.toHaveBeenCalled();
                    expect(ontologyManagerStub.getImportedOntologies).not.toHaveBeenCalled();
                    expect(component.errorMessage).toEqual('Error retrieving ontology');
                    expect(component.selectedOntology).toBeUndefined();
                    expect(component.selectedOntologyState).toBeUndefined();
                    expect(component.classes).toEqual([]);
                }));
                it('unless an error occurs with getOntology', fakeAsync(function() {
                    utilStub.getPropertyId.and.returnValue(commitId);
                    catalogManagerStub.getRecordMasterBranch.and.returnValue(of(branch));
                    mappingManagerStub.getOntology.and.returnValue(throwError(error));
                    component.selectOntology(selectedOntology);
                    tick();
                    expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(selectedOntology.recordId, catalogId);
                    expect(mappingManagerStub.getOntology).toHaveBeenCalledWith({
                        recordId: selectedOntology.recordId,
                        branchId,
                        commitId
                    });
                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
                    expect(ontologyManagerStub.getImportedOntologies).not.toHaveBeenCalled();
                    expect(component.errorMessage).toEqual('Error retrieving ontology');
                    expect(component.selectedOntology).toBeUndefined();
                    expect(component.selectedOntologyState).toBeUndefined();
                    expect(component.classes).toEqual([]);
                }));
                it('unless an error occurs with getImportedOntologies', fakeAsync(function() {
                    utilStub.getPropertyId.and.returnValue(commitId);
                    catalogManagerStub.getRecordMasterBranch.and.returnValue(of(branch));
                    mappingManagerStub.getOntology.and.returnValue(of(originalOntology));
                    ontologyManagerStub.getImportedOntologies.and.returnValue(throwError(error));
                    component.selectOntology(selectedOntology);
                    tick();
                    expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(selectedOntology.recordId, catalogId);
                    expect(mappingManagerStub.getOntology).toHaveBeenCalledWith({
                        recordId: selectedOntology.recordId,
                        branchId,
                        commitId
                    });
                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
                    expect(ontologyManagerStub.getImportedOntologies).toHaveBeenCalledWith(selectedOntology.recordId, branchId, commitId);
                    expect(component.errorMessage).toEqual('Error retrieving ontology');
                    expect(component.selectedOntology).toBeUndefined();
                    expect(component.selectedOntologyState).toBeUndefined();
                    expect(component.classes).toEqual([]);
                }));
                it('successfully', fakeAsync(function() {
                    const expectedState = {
                        recordId: selectedOntology.recordId,
                        branchId,
                        latest: {
                            commitId,
                            ontologies: [originalOntology, importedOntology],
                            classes: [mappingClass]
                        }
                    };
                    utilStub.getPropertyId.and.returnValue(commitId);
                    catalogManagerStub.getRecordMasterBranch.and.returnValue(of(branch));
                    mappingManagerStub.getOntology.and.returnValue(of(originalOntology));
                    ontologyManagerStub.getImportedOntologies.and.returnValue(of([{id: importedOntology.id, ontology: importedOntology.entities, documentFormat: '', ontologyId: ''}]));
                    mapperStateStub.getClasses.and.returnValue([mappingClass]);
                    component.selectOntology(selectedOntology);
                    tick();
                    expect(catalogManagerStub.getRecordMasterBranch).toHaveBeenCalledWith(selectedOntology.recordId, catalogId);
                    expect(mappingManagerStub.getOntology).toHaveBeenCalledWith({
                        recordId: selectedOntology.recordId,
                        branchId,
                        commitId
                    });
                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
                    expect(ontologyManagerStub.getImportedOntologies).toHaveBeenCalledWith(selectedOntology.recordId, branchId, commitId);
                    expect(mapperStateStub.getClasses).toHaveBeenCalledWith(expectedState.latest.ontologies);
                    expect(component.ontologyStates).toContain(expectedState);
                    expect(component.selectedOntologyState).toEqual(expectedState);
                    expect(component.selectedVersion).toEqual('latest');
                    expect(component.classes).toEqual([mappingClass]);
                    expect(component.errorMessage).toEqual('');
                }));
            });
        });
        describe('should select a version', function() {
            it('unless an ontology has not been selected', function() {
                component.selectVersion();
                expect(component.selectedOntologyState).toBeUndefined();
                expect(component.classes).toEqual([]);
                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                expect(mappingManagerStub.getOntology).not.toHaveBeenCalled();
                expect(ontologyManagerStub.getImportedOntologies).not.toHaveBeenCalled();
            });
            describe('of the selected ontology', function() {
                beforeEach(function() {
                    component.selectedOntologyState = {
                        recordId: ontologyRecord['@id'],
                        branchId
                    };
                    component.selectedOntology = selectedOntology;
                    component.catalogId = catalogId;
                });
                it('if the version has already been opened', function() {
                    component.selectedOntologyState.latest = {classes: [mappingClass]};
                    component.selectedVersion = 'latest';
                    component.selectVersion();
                    expect(component.errorMessage).toEqual('');
                    expect(component.classes).toEqual([mappingClass]);
                });
                describe('if the', function() {
                    beforeEach(function() {
                        utilStub.getPropertyId.and.returnValue(commitId);
                        catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
                        mappingManagerStub.getOntology.and.returnValue(of(originalOntology));
                        ontologyManagerStub.getImportedOntologies.and.returnValue(of([{id: importedOntology.id, ontology: importedOntology.entities, documentFormat: '', ontologyId: ''}]));
                        mapperStateStub.getClasses.and.returnValue([mappingClass]);
                    });
                    describe('latest version has not been opened yet', function() {
                        beforeEach(function() {
                            component.selectedVersion = 'latest';
                        });
                        it('unless an error occurs', fakeAsync(function() {
                            catalogManagerStub.getRecordBranch.and.returnValue(throwError(error));
                            component.selectVersion();
                            tick();
                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyRecord['@id'], catalogId);
                            expect(mappingManagerStub.getOntology).not.toHaveBeenCalled();
                            expect(ontologyManagerStub.getImportedOntologies).not.toHaveBeenCalled();
                            expect(component.errorMessage).toEqual('Error retrieving ontology');
                            expect(component.selectedOntology).toBeUndefined();
                            expect(component.selectedOntologyState).toBeUndefined();
                            expect(component.classes).toEqual([]);
                        }));
                        it('successfully', fakeAsync(function() {
                            const expectedVersion = {
                                commitId,
                                ontologies: [originalOntology, importedOntology],
                                classes: [mappingClass]
                            };
                            component.selectVersion();
                            tick();
                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branchId, ontologyRecord['@id'], catalogId);
                            expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
                            expect(mappingManagerStub.getOntology).toHaveBeenCalledWith({
                                recordId: ontologyRecord['@id'],
                                branchId,
                                commitId
                            });
                            expect(ontologyManagerStub.getImportedOntologies).toHaveBeenCalledWith(ontologyRecord['@id'], branchId, commitId);
                            expect(mapperStateStub.getClasses).toHaveBeenCalledWith(expectedVersion.ontologies);
                            expect(component.classes).toEqual([mappingClass]);
                            expect(component.selectedOntologyState.latest).toEqual(expectedVersion);
                            expect(component.errorMessage).toEqual('');
                        }));
                    });
                    describe('saved version has not been opened yet', function() {
                        beforeEach(function() {
                            component.selectedVersion = 'saved';
                            this.ontologyInfo = {
                                branchId,
                                commitId,
                                recordId: ontologyRecord['@id']
                            };
                            mappingStub.getSourceOntologyInfo.and.returnValue(this.ontologyInfo);
                        });
                        it('unless an error occurs', fakeAsync(function() {
                            mappingManagerStub.getOntology.and.returnValue(throwError(error));
                            component.selectVersion();
                            tick();
                            expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                            expect(mappingManagerStub.getOntology).toHaveBeenCalledWith(this.ontologyInfo);
                            expect(ontologyManagerStub.getImportedOntologies).not.toHaveBeenCalled();
                            expect(component.errorMessage).toEqual('Error retrieving ontology');
                            expect(component.selectedOntology).toBeUndefined();
                            expect(component.selectedOntologyState).toBeUndefined();
                            expect(component.classes).toEqual([]);
                        }));
                        it('successfully', fakeAsync(function() {
                            const expectedVersion = {
                                commitId,
                                ontologies: [originalOntology, importedOntology],
                                classes: [mappingClass]
                            };
                            component.selectVersion();
                            tick();
                            expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                            expect(mappingManagerStub.getOntology).toHaveBeenCalledWith(this.ontologyInfo);
                            expect(ontologyManagerStub.getImportedOntologies).toHaveBeenCalledWith(ontologyRecord['@id'], branchId, commitId);
                            expect(mapperStateStub.getClasses).toHaveBeenCalledWith(expectedVersion.ontologies);
                            expect(component.classes).toEqual([mappingClass]);
                            expect(component.selectedOntologyState.saved).toEqual(expectedVersion);
                            expect(component.errorMessage).toEqual('');
                        }));
                    });
                });
            });
        });
        describe('should set the correct state for setting the configuration', function() {
            beforeEach(function() {
                component.selectedOntologyState = {
                    recordId: ontologyRecord['@id'],
                    branchId,
                    latest: {
                        commitId,
                        ontologies: [originalOntology, importedOntology]
                    }
                };
                component.selectedVersion = 'latest';
                component.selectedOntology = selectedOntology;
                mapperStateStub.availableClasses = [];
            });
            it('if it has not changed', function() {
                mappingStub.getSourceOntologyInfo.and.returnValue({
                    recordId: ontologyRecord['@id'],
                    branchId,
                    commitId
                });
                component.set();
                expect(mappingStub.getSourceOntologyInfo).toHaveBeenCalledWith();
                expect(mapperStateStub.sourceOntologies).not.toEqual(component.selectedOntologyState.latest.ontologies);
                expect(mappingManagerStub.findIncompatibleMappings).not.toHaveBeenCalled();
                expect(mappingManagerStub.isDataMapping).not.toHaveBeenCalled();
                expect(mappingStub.getMappingEntity).not.toHaveBeenCalled();
                expect(mappingStub.getJsonld).not.toHaveBeenCalled();
                expect(mappingStub.getAllClassMappings).not.toHaveBeenCalled();
                expect(mappingStub.findClassWithDataMapping).not.toHaveBeenCalled();
                expect(mappingStub.findClassWithObjectMapping).not.toHaveBeenCalled();
                expect(mappingStub.setSourceOntologyInfo).not.toHaveBeenCalled();
                expect(mapperStateStub.changeProp).not.toHaveBeenCalled();
                expect(mapperStateStub.resetEdit).not.toHaveBeenCalled();
                expect(mapperStateStub.setProps).not.toHaveBeenCalled();
                expect(mapperStateStub.availableClasses).toEqual([]);
                expect(matDialogRef.close).toHaveBeenCalledWith();
            });
            describe('if it changed', function() {
                beforeEach(function() {
                    this.oldOntologyInfo = {
                        recordId: 'oldRecord',
                        branchId: 'oldBranch',
                        commitId: 'oldCommit',
                    };
                    mappingStub.getSourceOntologyInfo.and.returnValue(this.oldOntologyInfo);
                    mappingStub.getMappingEntity.and.returnValue({'@id': mappingId});
                    this.classMapping = {'@id': 'classMapping', [DELIM + 'mapsTo']: [{'@id': 'class'}]};
                    component.classes = [mappingClass];
                    mappingStub.getAllClassMappings.and.returnValue([this.classMapping]);
                });
                it('setting appropriate state', function() {
                    mappingManagerStub.findIncompatibleMappings.and.returnValue([]);
                    component.set();
                    expect(mapperStateStub.sourceOntologies).toEqual([originalOntology, importedOntology]);
                    expect(mappingStub.setSourceOntologyInfo).toHaveBeenCalledWith({ recordId: ontologyRecord['@id'], branchId, commitId });
                    expect(mappingStub.getMappingEntity).toHaveBeenCalledWith();
                    expect(mapperStateStub.selected.ontology).toEqual(selectedOntology.jsonld);
                    expect(mapperStateStub.changeProp).toHaveBeenCalledWith(mappingId, DELIM + 'sourceRecord', ontologyRecord['@id'], this.oldOntologyInfo.recordId, true);
                    expect(mapperStateStub.changeProp).toHaveBeenCalledWith(mappingId, DELIM + 'sourceBranch', branchId, this.oldOntologyInfo.branchId, true);
                    expect(mapperStateStub.changeProp).toHaveBeenCalledWith(mappingId, DELIM + 'sourceCommit', commitId, this.oldOntologyInfo.commitId, true);
                    expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                    expect(mapperStateStub.setProps).toHaveBeenCalledWith('class');
                    expect(mapperStateStub.availableClasses).toEqual(component.classes);
                    expect(matDialogRef.close).toHaveBeenCalledWith();
                });
                describe('removing incompatible mappings', function() {
                    beforeEach(function() {
                        this.badMapping = {'@id': 'bad'};
                        mappingManagerStub.findIncompatibleMappings.and.returnValue([this.badMapping]);
                        mappingStub.getJsonld.and.returnValue([this.badMapping]);
                    });
                    describe('if they are property mappings', function() {
                        beforeEach(function() {
                            mappingManagerStub.isPropertyMapping.and.returnValue(true);
                            mappingStub.findClassWithDataMapping.and.returnValue(this.classMapping);
                            mappingStub.findClassWithObjectMapping.and.returnValue(this.classMapping);
                        });
                        it('for data properties', function() {
                            mappingManagerStub.isDataMapping.and.returnValue(true);
                            component.set();
                            expect(mappingStub.findClassWithDataMapping).toHaveBeenCalledWith(this.badMapping['@id']);
                            expect(mappingStub.findClassWithObjectMapping).not.toHaveBeenCalled();
                            expect(mapperStateStub.deleteProp).toHaveBeenCalledWith(this.badMapping['@id'], this.classMapping['@id']);
                        });
                        it('for object properties', function() {
                            mappingManagerStub.isDataMapping.and.returnValue(false);
                            component.set();
                            expect(mappingStub.findClassWithDataMapping).not.toHaveBeenCalled();
                            expect(mappingStub.findClassWithObjectMapping).toHaveBeenCalledWith(this.badMapping['@id']);
                            expect(mapperStateStub.deleteProp).toHaveBeenCalledWith(this.badMapping['@id'], this.classMapping['@id']);
                        });
                    });
                    it('if they are class mappings', function() {
                        mappingManagerStub.isPropertyMapping.and.returnValue(false);
                        mappingManagerStub.isClassMapping.and.returnValue(true);
                        component.set();
                        expect(mapperStateStub.deleteClass).toHaveBeenCalledWith(this.badMapping['@id']);
                    });
                });
            });
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            spyOn(component, 'setOntologies');
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['.row', '.ontology-select-container', '.preview-display', '.ontologies', 'mat-selection-list', 'search-bar', 'mat-select'].forEach(test => {
            it('with a '+ test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether an error has occurred', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.errorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether an error has occurred when retrieving the records', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.recordsErrorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on how many ontology records there are', function() {
            component.ontologies = [selectedOntology];
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-list-option')).length).toEqual(component.ontologies.length);
        });
        it('depending on whether an ontology record has been selected', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.ontology-record-info')).length).toEqual(0);
            expect(element.queryAll(By.css('.no-selected-ontology')).length).toEqual(1);

            component.selectedOntology = selectedOntology;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.ontology-record-info')).length).toEqual(1);
            expect(element.queryAll(By.css('.no-selected-ontology')).length).toEqual(0);
        });
        it('depending on whether an ontology record state has been selected', function() {
            fixture.detectChanges();
            const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(setButton.properties['disabled']).toBeTruthy();

            component.selectedOntologyState = {};
            fixture.detectChanges();
            expect(setButton.properties['disabled']).toBeFalsy();
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        const button = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        button.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call set when the button is clicked', function() {
        component.ngOnInit();
        spyOn(component, 'set');
        const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.set).toHaveBeenCalledWith();
    });
});
