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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { SettingManagerService } from '../../../shared/services/settingManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { NewOntologyOverlayComponent } from '../newOntologyOverlay/newOntologyOverlay.component';
import { UploadOntologyOverlayComponent } from '../uploadOntologyOverlay/uploadOntologyOverlay.component';
import { UploadSnackbarComponent } from '../uploadSnackbar/uploadSnackbar.component';
import { OpenOntologyTabComponent } from './openOntologyTab.component';

describe('Open Ontology Tab component', function() {
    let component: OpenOntologyTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OpenOntologyTabComponent>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const error = 'Error Message';
    const recordId = 'recordId';
    const ontologyIRI = 'ontologyIRI';
    const ontologyRecord: JSONLDObject = {
        '@id': recordId,
        '@type': [ONTOLOGYEDITOR + 'OntologyRecord']
    };
    const displayItem = {
        title: 'title',
        description: 'description',
        ontologyIRI,
        jsonld: ontologyRecord
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                MatPaginatorModule,
                MatMenuModule,
                MatDividerModule
            ],
            declarations: [
                OpenOntologyTabComponent,
                MockComponent(SearchBarComponent),
                MockComponent(UploadOntologyOverlayComponent),
                MockComponent(NewOntologyOverlayComponent),
                MockComponent(ConfirmModalComponent),
                MockComponent(InfoMessageComponent),
                MockComponent(UploadSnackbarComponent),
                MockPipe(HighlightTextPipe)
            ],
            providers: [
                MockProvider(ProgressSpinnerService),
                MockProvider(CatalogManagerService),
                MockProvider(OntologyManagerService),
                MockProvider(OntologyStateService),
                MockProvider(MapperStateService),
                MockProvider(SettingManagerService),
                MockProvider(UtilService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OpenOntologyTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
        utilStub = null;
        mapperStateStub = null;
        catalogManagerStub = null;
        settingManagerStub = null;
        matDialog = null;
    });

    it('should initialize correctly', function() {
        spyOn(component, 'setPageOntologyRecords');
        component.ngOnInit();
        expect(component.setPageOntologyRecords).toHaveBeenCalledWith(0, '');
    });
    describe('controller methods', function() {
        it('should handle a click of the upload button', function() {
            const nativeElement = {
                click: jasmine.createSpy('click'),
                value: ''
            };
            component.fileInput = jasmine.createSpyObj('fileInput', {}, { nativeElement });
            component.clickUpload();
            expect(nativeElement.value).toBeNull();
            expect(nativeElement.click).toHaveBeenCalledWith();
        });
        it('should update the uploaded files', function() {
            spyOn(component, 'showUploadOntologyOverlay');
            const file = new File([], '');
            const dt = new DataTransfer();
            dt.items.add(file);
            component.updateFiles(dt.files);
            expect(ontologyStateStub.uploadFiles).toEqual([file]);
            expect(component.showUploadOntologyOverlay).toHaveBeenCalledWith();
        });
        describe('should show the uploadOntologyOverlay and handle when', function() {
            beforeEach(() => {
                spyOn(component, 'search');
                ontologyStateStub.uploadPending = 0;
            });
            it('upload has started', fakeAsync(function() {
                component.dialog = jasmine.createSpyObj('MatDialog', {
                    open: { componentInstance: {
                        uploadStarted: of(true)
                    }}
                });
                component.showUploadOntologyOverlay();
                tick();
                expect(component.dialog.open).toHaveBeenCalledWith(UploadOntologyOverlayComponent);
                expect(component.showSnackbar).toBeTrue();
                expect(component.search).not.toHaveBeenCalled();
            }));
            it('upload has not started', fakeAsync(function() {
                component.dialog = jasmine.createSpyObj('MatDialog', {
                    open: { componentInstance: {
                        uploadStarted: of(false)
                    }}
                });
                component.showUploadOntologyOverlay();
                tick();
                expect(component.dialog.open).toHaveBeenCalledWith(UploadOntologyOverlayComponent);
                expect(component.showSnackbar).toBeFalse();
                expect(component.search).toHaveBeenCalledWith();
            }));
        });
        it('should close the snackbar', function() {
            component.showSnackbar = true;
            component.closeSnackbar();
            expect(component.showSnackbar).toBeFalse();
        });
        it('should determine whether an ontology is open', function() {
            expect(component.isOpened(ontologyRecord)).toBeFalse();
            const listItem = new OntologyListItem();
            listItem.versionedRdfRecord.recordId = recordId;
            ontologyStateStub.list = [listItem];
            expect(component.isOpened(ontologyRecord)).toBeTrue();
        });
        describe('should open an ontology', function() {
            it('if it is already open', function() {
                const listItem = new OntologyListItem();
                listItem.versionedRdfRecord.recordId = recordId;
                ontologyStateStub.list = [listItem];
                component.open(displayItem);
                expect(ontologyStateStub.openOntology).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.listItem).toEqual(listItem);
                expect(listItem.active).toBeTrue();
            });
            describe('if it is not already open', function() {
                it('successfully', fakeAsync(function() {
                    ontologyStateStub.openOntology.and.returnValue(of(null));
                    component.open(displayItem);
                    tick();
                    expect(ontologyStateStub.openOntology).toHaveBeenCalledWith(recordId, 'title');
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                }));
                it('unless an error occurs', fakeAsync(function() {
                    ontologyStateStub.openOntology.and.returnValue(throwError(error));
                    component.open(displayItem);
                    tick();
                    expect(ontologyStateStub.openOntology).toHaveBeenCalledWith(recordId, 'title');
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                }));
            });
        });
        it('should set the correct state for creating a new ontology', fakeAsync(function() {
            const namespace = 'https://mobi.com/ontologies/';
            settingManagerStub.getDefaultNamespace.and.returnValue(of(namespace));
            component.newOntology();
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(NewOntologyOverlayComponent, {autoFocus: false, data: { defaultNamespace: namespace}});
        }));
        describe('should show the delete confirmation overlay', function() {
            beforeEach(function() {
                spyOn(component, 'deleteOntology');
            });
            it('and ask the user for confirmation', fakeAsync(function() {
                component.showDeleteConfirmationOverlay(displayItem);
                tick();
                expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                    data: {content: jasmine.stringMatching(/^((?!error-display).)*$/)}
                });
                expect(component.deleteOntology).toHaveBeenCalledWith(recordId);
            }));
            it('and should warn the user if the ontology is open in the mapping tool', fakeAsync(function() {
                mapperStateStub.sourceOntologies = [{
                    recordId,
                    id: '',
                    entities: []
                }];
                component.showDeleteConfirmationOverlay(displayItem);
                tick();
                expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                    data: {content: jasmine.stringContaining('<error-display>')}
                });
                expect(component.deleteOntology).toHaveBeenCalledWith(recordId);
            }));
        });
        describe('should delete an ontology', function() {
            beforeEach(function() {
                component.filterText = 'searchText';
                ontologyStateStub.getStateByRecordId.and.returnValue({id: 'state', model: []});
                spyOn(component, 'setPageOntologyRecords');
            });
            it('unless an error occurs', fakeAsync(function() {
                ontologyManagerStub.deleteOntology.and.returnValue(throwError(error));
                component.deleteOntology(recordId);
                tick();
                expect(ontologyManagerStub.deleteOntology).toHaveBeenCalledWith(recordId);
                expect(ontologyStateStub.closeOntology).not.toHaveBeenCalled();
                expect(ontologyStateStub.getStateByRecordId).not.toHaveBeenCalled();
                expect(ontologyStateStub.deleteState).not.toHaveBeenCalled();
                expect(component.setPageOntologyRecords).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
            it('successfully', fakeAsync(function() {
                ontologyManagerStub.deleteOntology.and.returnValue(of(null));
                component.deleteOntology(recordId);
                tick();
                expect(ontologyManagerStub.deleteOntology).toHaveBeenCalledWith(recordId);
                expect(ontologyStateStub.closeOntology).toHaveBeenCalledWith(recordId);
                expect(ontologyStateStub.getStateByRecordId).toHaveBeenCalledWith(recordId);
                expect(ontologyStateStub.deleteState).toHaveBeenCalledWith(recordId);
                expect(component.setPageOntologyRecords).toHaveBeenCalledWith(0, 'searchText');
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        it('should handle getting a specific page of results', function() {
            spyOn(component, 'setPageOntologyRecords');
            const event = new PageEvent();
            event.pageIndex = 10;
            component.filterText = 'searchText';
            component.getPage(event);
            expect(component.setPageOntologyRecords).toHaveBeenCalledWith(10, 'searchText');
        });
        it('should get the list of ontology records at the specified page', fakeAsync(function() {
            const catalogId = 'catalogId';
            const sortOption = {field: DCTERMS + 'title', label: '', asc: true};
            const expectedPaginatedConfig = {
                pageIndex: 1,
                limit: 10,
                type: ONTOLOGYEDITOR + 'OntologyRecord',
                sortOption,
                searchText: 'searchText'
            };
            catalogManagerStub.localCatalog = {'@id': catalogId};
            catalogManagerStub.sortOptions = [sortOption];

            utilStub.getDctermsValue.and.callFake((obj, prop) => prop);
            utilStub.getPropertyId.and.returnValue(ontologyIRI);
            const headers = {'x-total-count': '1'};
            catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse({body: [ontologyRecord, {'@id': 'other'}], headers: new HttpHeaders(headers)})));
            component.setPageOntologyRecords(1, 'searchText');
            tick();
            expect(component.pageIndex).toEqual(1);
            expect(component.filterText).toEqual('searchText');
            expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.ontologyList);
            expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.ontologyList);
            expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, expectedPaginatedConfig, true);
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(ontologyRecord, 'title');
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(ontologyRecord, 'description');
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(ontologyRecord, ONTOLOGYEDITOR + 'ontologyIRI');
            expect(component.filteredList).toContain({
                title: 'title',
                ontologyIRI,
                description: 'description',
                jsonld: ontologyRecord
            });
            expect(component.totalSize).toEqual(1);
        }));
        it('should perform a search', function() {
            spyOn(component, 'setPageOntologyRecords');
            component.searchBindModel = 'searchText'; 
            component.search();
            expect(component.setPageOntologyRecords).toHaveBeenCalledWith(0 , 'searchText');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.open-ontology-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-10')).length).toEqual(1);
            expect(element.queryAll(By.css('.search-form')).length).toEqual(1);
            expect(element.queryAll(By.css('.ontologies')).length).toEqual(1);
        });
        ['search-bar', 'input[type="file"].d-none', '.ontologies', 'mat-paginator'].forEach(item => {
            it('with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
        });
        it('depending on whether the snackbar should be shown', function() {
            spyOn(component, 'setPageOntologyRecords');
            expect(element.queryAll(By.css('upload-snackbar')).length).toEqual(0);

            component.showSnackbar = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('upload-snackbar')).length).toEqual(1);
        });
        it('with buttons to upload an ontology and make a new ontology', function() {
            const buttons = element.queryAll(By.css('.search-form button'));
            expect(buttons.length).toEqual(2);
            expect(['Upload Ontology', 'New Ontology']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Upload Ontology', 'New Ontology']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('depending on how many ontologies there are', function() {
            spyOn(component, 'setPageOntologyRecords');
            fixture.detectChanges();
            expect(element.queryAll(By.css('.ontologies info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('.ontologies .ontology')).length).toEqual(0);
            
            component.filteredList = [displayItem];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.ontologies .ontology')).length).toEqual(1);
            expect(element.queryAll(By.css('.ontologies info-message')).length).toEqual(0);
        });
        it('depending on whether an ontology is open', function() {
            spyOn(component, 'setPageOntologyRecords');
            component.filteredList = [displayItem];
            const spy = spyOn(component, 'isOpened').and.returnValue(false);
            fixture.detectChanges();
            const ontology = element.queryAll(By.css('.ontologies .ontology h3'))[0];
            expect(ontology.queryAll(By.css('.text-muted')).length).toEqual(0);

            spy.and.returnValue(true);
            fixture.detectChanges();
            expect(ontology.queryAll(By.css('.text-muted')).length).toEqual(1);
        });
    });
    it('should call newOntology when the button is clicked', function() {
        spyOn(component, 'newOntology');
        const button = element.queryAll(By.css('.search-form button.new-button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.newOntology).toHaveBeenCalledWith();
    });
    it('should call clickUpload when the button is clicked', function() {
        spyOn(component, 'clickUpload');
        const button = element.queryAll(By.css('.search-form button.upload-button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.clickUpload).toHaveBeenCalledWith();
    });
    describe('menu button', function() {
        beforeEach(function() {
            spyOn(component, 'setPageOntologyRecords');
            component.filteredList = [displayItem];
            fixture.detectChanges();
            const menuButton = element.queryAll(By.css('button.menu-button'))[0];
            menuButton.triggerEventHandler('click', null);
        });
        it('should call showDeleteConfirmationOverlay', function() {
            spyOn(component, 'showDeleteConfirmationOverlay');
            const button = element.queryAll(By.css('.mat-menu-panel button.delete-record'))[0];
            button.triggerEventHandler('click', null);
            expect(component.showDeleteConfirmationOverlay).toHaveBeenCalledWith(displayItem);
        });
    });
});
