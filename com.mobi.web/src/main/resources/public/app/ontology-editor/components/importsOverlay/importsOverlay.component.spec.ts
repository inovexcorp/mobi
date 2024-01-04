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
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyDetails } from '../../../datasets/models/ontologyDetails.interface';
import { DCTERMS, ONTOLOGYEDITOR, OWL } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ImportsOverlayComponent } from './importsOverlay.component';

describe('Imports Overlay component', function() {
    let component: ImportsOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ImportsOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<ImportsOverlayComponent>>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let httpMock: HttpTestingController;
    let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const url = 'http://test.com';
    const error = 'Error Message';
    const catalogId = 'catalog';
    const recordId = 'recordId';
    const ontologyIRI = 'ontologyIRI';
    const sortOption = {field: `${DCTERMS}title`, label: '', asc: true};
    const ontologyRecord: JSONLDObject = {
        '@id': recordId,
        [`${DCTERMS}title`]: [{ '@value': 'title' }],
        [`${ONTOLOGYEDITOR}ontologyIRI`]: [{ '@id': ontologyIRI }]
    };
    const ontologyDetails: OntologyDetails = {
        recordId,
        ontologyIRI,
        title: 'title',
        selected: false,
        jsonld: ontologyRecord
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatListModule,
                MatChipsModule,
                MatTabsModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                ImportsOverlayComponent,
                MockComponent(InfoMessageComponent),
                MockComponent(ErrorDisplayComponent),
                MockComponent(SearchBarComponent),
            ],
            providers: [
                MockProvider(ProgressSpinnerService),
                MockProvider(CatalogManagerService),
                MockProvider(OntologyStateService),
                MockProvider(PropertyManagerService),
                MockProvider(ToastService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ImportsOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ImportsOverlayComponent>>;
        propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;

        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.sortOptions = [sortOption];
        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {'@id': 'ontology'};
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
        catalogManagerStub = null;
        progressSpinnerStub = null;
        propertyManagerStub = null;
        toastStub = null;
    });

    it('initializes correctly', function() {
        component.ngOnInit();
        expect(component.catalogId).toEqual(catalogId);
        expect(component.getOntologyConfig.sortOption).toEqual(sortOption);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a mat-tab-group', function() {
            expect(element.queryAll(By.css('mat-tab-group')).length).toEqual(1);
        });
        it('with a tab for urls', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(1);
            expect(element.queryAll(By.css('input[name="url"]')).length).toEqual(1);
        });
        it('with a tab for server ontologies', function() {
            component.tabIndex = 1;
            fixture.detectChanges();
            expect(element.queryAll(By.css('search-bar')).length).toEqual(1);
            expect(element.queryAll(By.css('.ontologies')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-chip-list')).length).toEqual(1);
        });
        it('depending on whether an error has occurred on the URL tab', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.urlError = error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether an error has occurred on the Server tab', function() {
            component.tabIndex = 1;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.serverError = error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('depending on whether the url pattern is incorrect', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeTruthy();
            
            component.importForm.controls.url.setValue('test');
            component.importForm.markAsDirty();
            component.importForm.markAsTouched();
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.importForm.controls.url.setValue(url);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on how many ontologies there are', function() {
            component.tabIndex = 1;
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('.ontologies mat-list-option')).length).toEqual(0);

            component.ontologies = [ontologyDetails];
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('.ontologies mat-list-option')).length).toEqual(component.ontologies.length);
        });
        it('depending on how many ontologies are selected', function() {
            component.tabIndex = 1;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-chip')).length).toEqual(0);

            component.selectedOntologies = [ontologyDetails];
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-chip')).length).toEqual(1);
        });
        it('depending on whether any ontologies are selected', function() {
            component.tabIndex = 1;
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeTruthy();

            component.selectedOntologies = [ontologyDetails];
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should set the ontology list', function() {
            beforeEach(function() {
                component.tabIndex = 1;
                fixture.detectChanges();
            });
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecords.and.returnValue(throwError(error));
                component.setOntologies();
                tick();
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.ontologiesList, 30);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.ontologiesList);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.getOntologyConfig, true);
                expect(component.ontologies).toEqual([]);
                expect(component.serverError).toEqual(error);
            }));
            it('successfully', fakeAsync(function() {
                spyOn(component, 'getOntologyIRI').and.returnValue(ontologyIRI);
                const ontology2 = {'@id': 'ontology2'};
                const ontology3 = {
                  '@id': 'ontology3',
                  [`${DCTERMS}title`]: [{ '@value': 'ontology3' }]
                };
                component.selectedOntologies = [{
                    recordId: ontology3['@id'],
                    title: '',
                    ontologyIRI: '',
                    selected: true,
                    jsonld: ontology3
                }];
                ontologyStateStub.listItem.versionedRdfRecord.recordId = ontology2['@id'];
                catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse({body: [ontologyRecord, ontology2, ontology3]})));
                component.setOntologies();
                tick();
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.ontologiesList, 30);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.ontologiesList);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.getOntologyConfig, true);
                expect(component.ontologies).toEqual([
                    ontologyDetails,
                    {recordId: ontology3['@id'], ontologyIRI, title: 'ontology3', selected: true, jsonld: ontology3}]);
                expect(component.serverError).toEqual('');
            }));
        });
        describe('should toggle an ontology if it had been', function() {
            beforeEach(function() {
                this.ontology = {selected: true, title: 'A'};
            });
            it('selected', function() {
                const ontology = Object.assign({}, ontologyDetails);
                ontology.selected = true;
                component.selectedOntologies = [ontology];
                component.toggleOntology(ontology);
                expect(ontology.selected).toBe(false);
                expect(component.selectedOntologies).toEqual([]);
            });
            it('unselected', function() {
                const ontology = Object.assign({}, ontologyDetails);
                component.selectedOntologies = [];
                component.toggleOntology(ontology);
                expect(ontology.selected).toBe(true);
                expect(component.selectedOntologies).toEqual([ontology]);
            });
        });
        it('should get the ontology IRI of an OntologyRecord', function() {
            expect(component.getOntologyIRI(ontologyRecord)).toEqual(ontologyIRI);
        });
        describe('should update the appropriate variables if clicking the', function() {
            beforeEach(function() {
                component.ontologies = [];
                component.getOntologyConfig.searchText = 'test';
                component.selectedOntologies = [ontologyDetails];
                spyOn(component, 'setOntologies');
            });
            describe('On Server tab', function() {
                it('if the ontologies have not been retrieved', function() {
                    const event = new MatTabChangeEvent();
                    event.index = 1;
                    component.onTabChanged(event);
                    component.importForm.controls.url.setValue('');
                    expect(component.importForm.controls.url.valid).toBeTrue();
                    expect(component.getOntologyConfig.searchText).toEqual('');
                    expect(component.selectedOntologies).toEqual([]);
                    expect(component.setOntologies).toHaveBeenCalledWith();
                });
                it('if the ontologies have been retrieved', function() {
                    const event = new MatTabChangeEvent();
                    event.index = 1;
                    component.ontologies = [ontologyDetails];
                    component.onTabChanged(event);
                    component.importForm.controls.url.setValue('');
                    expect(component.importForm.controls.url.valid).toBeTrue();
                    expect(component.getOntologyConfig.searchText).toEqual('test');
                    expect(component.selectedOntologies).toEqual([ontologyDetails]);
                    expect(component.setOntologies).not.toHaveBeenCalled();
                });
            });
            it('URL tab', function() {
                const event = new MatTabChangeEvent();
                event.index = 0;
                component.onTabChanged(event);
                expect(component.importForm.controls.url.invalid).toBeTrue();
                component.importForm.controls.url.setValue(url);
                expect(component.importForm.controls.url.valid).toBeTrue();
                expect(component.setOntologies).not.toHaveBeenCalled();
                expect(component.getOntologyConfig.searchText).toEqual('test');
                expect(component.selectedOntologies).toEqual([ontologyDetails]);
            });
        });
        describe('addImport should call the correct methods', function() {
            beforeEach(function() {
                spyOn(component, 'confirmed');
            });
            describe('if importing from a URL', function() {
                beforeEach(function() {
                    component.importForm.controls.url.setValue(url);
                });
                it('and get request resolves', function() {
                    component.addImport();
                    const request = httpMock.expectOne({url: '/mobirest/imported-ontologies/' + encodeURIComponent(url), method: 'GET'});
                    request.flush(200);
                    expect(component.confirmed).toHaveBeenCalledWith([url], 0);
                    expect(component.urlError).toEqual('');
                });
                it('when get request rejects', function() {
                    component.addImport();
                    const request = httpMock.expectOne({url: '/mobirest/imported-ontologies/' + encodeURIComponent(url), method: 'GET'});
                    request.flush('flush', { status: 400, statusText: error });
                    expect(component.confirmed).not.toHaveBeenCalled();
                    expect(component.urlError).toEqual('The provided URL was unresolvable.');
                });
            });
            it('if importing Mobi ontologies', function() {
                component.tabIndex = 1;
                component.selectedOntologies = [ontologyDetails];
                component.addImport();
                httpMock.expectNone('/mobirest/imported-ontologies');
                expect(component.confirmed).toHaveBeenCalledWith([ontologyIRI], 1);
            });
        });
        describe('confirmed should call the correct methods', function() {
            it('if there are duplicate values', function() {
                propertyManagerStub.addId.and.returnValue(false);
                component.confirmed([url], 0);
                expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${OWL}imports`, url);
                expect(toastStub.createWarningToast).toHaveBeenCalledWith('Duplicate property values not allowed');
                expect(ontologyStateStub.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateStub.saveCurrentChanges).not.toHaveBeenCalled();
                expect(ontologyStateStub.updateOntology).not.toHaveBeenCalled();
                expect(matDialogRef.close).toHaveBeenCalledWith(false);
            });
            describe('if there are no duplicated values', function() {
                beforeEach(function() {
                    propertyManagerStub.addId.and.returnValue(true);
                    this.additionsObj = {
                        '@id': ontologyStateStub.listItem.selected['@id'],
                        [`${OWL}imports`]: [{'@id': url}]
                    };
                });
                describe('when save current changes resolves', function() {
                    beforeEach(function() {
                        ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
                    });
                    it('when update ontology resolves', fakeAsync(function() {
                        ontologyStateStub.isCommittable.and.returnValue(true);
                        ontologyStateStub.updateOntology.and.returnValue(of(null));
                        component.confirmed([url], 0);
                        tick();
                        expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${OWL}imports`, url);
                        expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, this.additionsObj);
                        expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                        expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.commitId, ontologyStateStub.listItem.upToDate, ontologyStateStub.listItem.inProgressCommit);
                        expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    }));
                    it('when update ontology rejects', fakeAsync(function() {
                        ontologyStateStub.updateOntology.and.returnValue(throwError(error));
                        component.confirmed([url], 0);
                        tick();
                        expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${OWL}imports`, url);
                        expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, this.additionsObj);
                        expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                        expect(ontologyStateStub.updateOntology).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, ontologyStateStub.listItem.versionedRdfRecord.branchId, ontologyStateStub.listItem.versionedRdfRecord.commitId, ontologyStateStub.listItem.upToDate, ontologyStateStub.listItem.inProgressCommit);
                        expect(matDialogRef.close).not.toHaveBeenCalled();
                        expect(component.urlError).toEqual(error);
                    }));
                });
                it('when save current changes rejects', fakeAsync(function() {
                    ontologyStateStub.saveCurrentChanges.and.returnValue(throwError(error));
                    component.confirmed([url], 0);
                    tick();
                    expect(propertyManagerStub.addId).toHaveBeenCalledWith(ontologyStateStub.listItem.selected, `${OWL}imports`, url);
                    expect(ontologyStateStub.addToAdditions).toHaveBeenCalledWith(ontologyStateStub.listItem.versionedRdfRecord.recordId, this.additionsObj);
                    expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
                    expect(ontologyStateStub.updateOntology).not.toHaveBeenCalled();
                    expect(matDialogRef.close).not.toHaveBeenCalled();
                    expect(component.urlError).toEqual(error);
                }));
            });
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call addImport when the button is clicked', function() {
        spyOn(component, 'addImport');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.addImport).toHaveBeenCalledWith();
    });
});
