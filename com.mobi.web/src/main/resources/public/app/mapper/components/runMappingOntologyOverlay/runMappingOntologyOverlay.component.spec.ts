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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CATALOG, DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { BranchSelectComponent } from '../../../shared/components/branchSelect/branchSelect.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { RunMappingOntologyOverlayComponent } from './runMappingOntologyOverlay.component';

describe('Run Mapping Ontology Overlay component', function() {
    let component: RunMappingOntologyOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RunMappingOntologyOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<RunMappingOntologyOverlayComponent>>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const error = 'Error message';
    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const branchId = 'branchId';
    const mappingRecordId = 'mappingRecordId';
    const ontologyIRI = 'iri';
    const sortOption = {
        asc: true,
        field: `${DCTERMS}title`,
        label: ''
    };
    const record: JSONLDObject = {
      '@id': recordId,
      [`${DCTERMS}title`]: [{ '@value': 'title' }],
      [`${CATALOG}trackedIdentifier`]: [{ '@id': ontologyIRI }]
    };
    const branch: JSONLDObject = {
      '@id': branchId,
      [`${DCTERMS}title`]: [{ '@value': 'title' }]
    };
    const ontologyPreview = {
        id: recordId,
        title: 'title',
        ontologyIRI
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatDialogModule,
                MatAutocompleteModule,
                MatRadioModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                RunMappingOntologyOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(BranchSelectComponent),
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(DelimitedManagerService),
                MockProvider(CatalogManagerService),
                MockProvider(OntologyStateService),
                MockProvider(ToastService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RunMappingOntologyOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RunMappingOntologyOverlayComponent>>;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        catalogManagerStub.localCatalog = { '@id': catalogId };
        mapperStateStub.selected = {
            mapping: undefined,
            difference: new Difference(),
            record: {
                id: mappingRecordId,
                title: '',
                modified: '',
                description: '',
                keywords: [],
                branch: ''
            },
        };
        mapperStateStub.step = 2;
        mapperStateStub.selectMappingStep = 0;
        catalogManagerStub.sortOptions = [sortOption];
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [record]})));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mapperStateStub = null;
        delimitedManagerStub = null;
        ontologyStateStub = null;
        toastStub = null;
    });

    describe('should handle updates to the ontology select value', function() {
        beforeEach(function() {
            spyOn(component, 'getOntologyIRI').and.returnValue(ontologyIRI);
            component.ngOnInit();
            fixture.detectChanges();
        });
        it('if search text is provided', fakeAsync(function() {
            component.ontologyControl.setValue('text');
            component.ontologyControl.updateValueAndValidity();
            tick(1000);
            fixture.detectChanges();
            component.filteredOntologies.subscribe(results => {
                expect(results).toEqual([ontologyPreview]);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, {
                    searchText: 'text',
                    limit: 50,
                    type: [`${ONTOLOGYEDITOR}OntologyRecord`],
                    sortOption
                }, true);
                expect(component.getOntologyIRI).toHaveBeenCalledWith(record);
            });
        }));
        it('if an object is provided', fakeAsync(function() {
            component.ontologyControl.setValue(ontologyPreview);
            component.ontologyControl.updateValueAndValidity();
            tick(1000);
            fixture.detectChanges();
            component.filteredOntologies.subscribe(results => {
                expect(results).toEqual([ontologyPreview]);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, {
                    searchText: 'title',
                    limit: 50,
                    type: [`${ONTOLOGYEDITOR}OntologyRecord`],
                    sortOption
                }, true);
                expect(component.getOntologyIRI).toHaveBeenCalledWith(record);
            });
        }));
        it('if no search text is provided', fakeAsync(function() {
            component.ontologyControl.updateValueAndValidity();
            tick(1000);
            fixture.detectChanges();
            component.filteredOntologies.subscribe(results => {
                expect(results).toEqual([ontologyPreview]);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, {
                    searchText: '',
                    limit: 50,
                    type: [`${ONTOLOGYEDITOR}OntologyRecord`],
                    sortOption
                }, true);
                expect(component.getOntologyIRI).toHaveBeenCalledWith(record);
            });
        }));
    });
    describe('controller methods', function() {
        it('should get the display text for an ontology', function() {
            expect(component.getDisplayText(ontologyPreview)).toEqual(ontologyPreview.title);
            expect(component.getDisplayText(undefined)).toEqual('');
        });
        describe('should select an ontology and set branches', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
            });
            it('unless the ontology is undefined', function() {
                const event: MatAutocompleteSelectedEvent = {
                    option: {
                        value: undefined
                    }
                } as MatAutocompleteSelectedEvent;
                component.selectOntology(event);
                expect(component.ontology).toBeUndefined();
                expect(catalogManagerStub.getRecordBranches).not.toHaveBeenCalled();
                expect(component.branches).toEqual([]);
                expect(component.branch).toBeUndefined();
            });
            it('successfully', fakeAsync(function() {
                const masterBranch = {
                  '@id': 'master',
                  [`${DCTERMS}title`]: [{ '@value': 'MASTER' }]
                };
                catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [masterBranch, branch]})));
                const event: MatAutocompleteSelectedEvent = {
                    option: {
                        value: ontologyPreview
                    }
                } as MatAutocompleteSelectedEvent;
                component.selectOntology(event);
                tick();
                expect(component.ontology).toEqual(ontologyPreview);
                expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId, { sortOption });
                expect(component.branches).toEqual([masterBranch, branch]);
                expect(component.branch).toEqual(masterBranch);
            }));
        });
        it('should get the IRI of an ontology', function() {
            expect(component.getOntologyIRI(record)).toEqual(ontologyIRI);
        });
        describe('should set the correct state for running mapping', function() {
            beforeEach(function() {
                component.branch = branch;
                component.update = false;
                component.ontology = ontologyPreview;
                delimitedManagerStub.mapAndCommit.and.returnValue(of(new HttpResponse({status: 200})));
            });
            describe('if it is also being saved', function() {
                beforeEach(function() {
                    mapperStateStub.editMapping = true;
                });
                describe('and there are changes', function() {
                    beforeEach(function() {
                        mapperStateStub.isMappingChanged.and.returnValue(true);
                    });
                    it('unless an error occurs', fakeAsync(function() {
                        mapperStateStub.saveMapping.and.returnValue(throwError(error));
                        component.run();
                        tick();
                        expect(mapperStateStub.saveMapping).toHaveBeenCalledWith();
                        expect(delimitedManagerStub.mapAndDownload).not.toHaveBeenCalled();
                        expect(delimitedManagerStub.mapAndUpload).not.toHaveBeenCalled();
                        expect(mapperStateStub.step).toBe(2);
                        expect(mapperStateStub.initialize).not.toHaveBeenCalled();
                        expect(mapperStateStub.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerStub.reset).not.toHaveBeenCalled();
                        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                        expect(matDialogRef.close).not.toHaveBeenCalled();
                        expect(component.errorMessage).toEqual(error);
                    }));
                    describe('successfully', function() {
                        beforeEach(function() {
                            mapperStateStub.saveMapping.and.returnValue(of(mappingRecordId));
                        });
                        it('committing the data with no active merge', fakeAsync(function() {
                            const listItem = new OntologyListItem();
                            listItem.versionedRdfRecord.recordId = recordId;
                            listItem.versionedRdfRecord.branchId = branchId;
                            listItem.merge.active = false;
                            ontologyStateStub.list = [listItem];
                            component.run();
                            tick();
                            expect(mapperStateStub.saveMapping).toHaveBeenCalledWith();
                            expect(delimitedManagerStub.mapAndCommit).toHaveBeenCalledWith(mappingRecordId, recordId, branchId, component.update);
                            expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                            expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                            expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                            expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                            expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                            expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                            expect(matDialogRef.close).toHaveBeenCalledWith();
                            expect(component.errorMessage).toEqual('');
                        }));
                        it('committing the data with an active merge', fakeAsync(function() {
                            const listItem = new OntologyListItem();
                            listItem.versionedRdfRecord.recordId = recordId;
                            listItem.versionedRdfRecord.branchId = branchId;
                            listItem.merge.active = true;
                            ontologyStateStub.list = [listItem];
                            component.run();
                            tick();
                            expect(mapperStateStub.saveMapping).toHaveBeenCalledWith();
                            expect(delimitedManagerStub.mapAndCommit).toHaveBeenCalledWith(mappingRecordId, recordId, branchId, component.update);
                            expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.stringContaining('You have a merge in progress'), jasmine.any(Object));
                            expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                            expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                            expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                            expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                            expect(matDialogRef.close).toHaveBeenCalledWith();
                            expect(component.errorMessage).toEqual('');
                        }));
                    });
                });
                describe('and there are no changes', function() {
                    beforeEach(function() {
                        mapperStateStub.isMappingChanged.and.returnValue(false);
                    });
                    it('and commits the data with no active merge', fakeAsync(function() {
                        const listItem = new OntologyListItem();
                        listItem.versionedRdfRecord.recordId = recordId;
                        listItem.versionedRdfRecord.branchId = branchId;
                        listItem.merge.active = false;
                        ontologyStateStub.list = [listItem];
                        component.run();
                        tick();
                        expect(mapperStateStub.saveMapping).not.toHaveBeenCalled();
                        expect(delimitedManagerStub.mapAndCommit).toHaveBeenCalledWith(mappingRecordId, recordId, branchId, component.update);
                        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                        expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                        expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                        expect(component.errorMessage).toEqual('');
                    }));
                    it('and commits the data with an active merge', fakeAsync(function() {
                        const listItem = new OntologyListItem();
                        listItem.versionedRdfRecord.recordId = recordId;
                        listItem.versionedRdfRecord.branchId = branchId;
                        listItem.merge.active = true;
                        ontologyStateStub.list = [listItem];
                        component.run();
                        tick();
                        expect(mapperStateStub.saveMapping).not.toHaveBeenCalled();
                        expect(delimitedManagerStub.mapAndCommit).toHaveBeenCalledWith(mappingRecordId, recordId, branchId, component.update);
                        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.stringContaining('You have a merge in progress'), jasmine.any(Object));
                        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                        expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                        expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    }));
                });
            });
            describe('if it is not being saved', function() {
                beforeEach(function() {
                    mapperStateStub.editMapping = false;
                });
                it('and commits the data', fakeAsync(function() {
                    component.update = true;
                    component.run();
                    tick();
                    expect(mapperStateStub.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerStub.mapAndCommit).toHaveBeenCalledWith(mappingRecordId, recordId, branchId, component.update);
                    expect(mapperStateStub.step).toBe(mapperStateStub.selectMappingStep);
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(mapperStateStub.initialize).toHaveBeenCalledWith();
                    expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                    expect(delimitedManagerStub.reset).toHaveBeenCalledWith();
                    expect(matDialogRef.close).toHaveBeenCalledWith();
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
        ['mat-form-field', 'input[aria-label="Ontology"]', 'mat-autocomplete', 'branch-select', 'mat-radio-group'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.errorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
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
    it('should call download when the button is clicked', function() {
        spyOn(component, 'run');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.run).toHaveBeenCalledWith();
    });
});
