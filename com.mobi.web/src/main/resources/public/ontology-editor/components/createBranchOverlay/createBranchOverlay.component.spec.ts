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
import { MatButtonModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatIconModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { 
    cleanStylesFromDOM
 } from '../../../../../../test/ts/Shared';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CATALOG } from '../../../prefixes';
import { CreateBranchOverlayComponent } from './createBranchOverlay.component';

describe('Create Branch Overlay component', function() {
    let component: CreateBranchOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateBranchOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateBranchOverlayComponent>>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;
    let catalogManagerServiceStub: jasmine.SpyObj<CatalogManagerService>;

    const error = 'error';
    const iri = 'iri#';
    const catalogId = 'localCatalogIRI';
    const commitId = 'commitId';
    const branchId = 'branchId';
    const branch: JSONLDObject = {
        '@id': branchId,
        [CATALOG + 'head']: [{'@id': commitId}]
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                CreateBranchOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(StaticIriComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(CatalogManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CreateBranchOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        ontologyStateServiceStub = TestBed.get(OntologyStateService);
        catalogManagerServiceStub = TestBed.get(CatalogManagerService);
        
        ontologyStateServiceStub.saveCurrentChanges.and.returnValue(of([]));
        ontologyStateServiceStub.getDefaultPrefix.and.returnValue(iri);
        ontologyStateServiceStub.listItem = new OntologyListItem();
        catalogManagerServiceStub.localCatalog = {'@id': catalogId};

        catalogManagerServiceStub.createRecordBranch.and.returnValue(of(branchId));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateServiceStub = null;
        catalogManagerServiceStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="title"]', 'textarea'].forEach(function(item) {
            it('with a ' + item, function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
        });
        it('depending on the validity of the form', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.createForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.createForm.controls.title.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether an error occurred', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.error = error;
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
    describe('controller methods', function() {
        describe('create calls the correct method', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
            });
            describe('when createRecordBranch is resolved', function() {
                beforeEach(function() {
                    catalogManagerServiceStub.createRecordBranch.and.returnValue(of(branchId));
                });
                describe('and when getRecordBranch is resolved', function() {
                    beforeEach(function() {
                        catalogManagerServiceStub.getRecordBranch.and.returnValue(of(branch));
                    });
                    it('and when updateState is resolved', fakeAsync(function() {
                        ontologyStateServiceStub.updateState.and.returnValue(of(null));
                        component.create();
                        tick();
                        expect(catalogManagerServiceStub.createRecordBranch).toHaveBeenCalledWith(
                            ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, 
                            catalogId, 
                            component.createForm.value, 
                            ontologyStateServiceStub.listItem.versionedRdfRecord.commitId);
                        expect(catalogManagerServiceStub.getRecordBranch).toHaveBeenCalledWith(branchId,
                            ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, catalogId);
                        expect(ontologyStateServiceStub.updateState).toHaveBeenCalledWith({ recordId: ontologyStateServiceStub.listItem.versionedRdfRecord.recordId,
                            commitId, branchId });
                        expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    }));
                    it('and when updateState is rejected', fakeAsync(function() {
                        ontologyStateServiceStub.updateState.and.returnValue(throwError(error));
                        component.create();
                        tick();
                        expect(catalogManagerServiceStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId,
                            catalogId, component.createForm.value,  ontologyStateServiceStub.listItem.versionedRdfRecord.commitId);
                        expect(catalogManagerServiceStub.getRecordBranch).toHaveBeenCalledWith(branchId,
                            ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, catalogId);
                        expect(ontologyStateServiceStub.updateState).toHaveBeenCalledWith({ recordId: ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, commitId, branchId });
                        expect(component.error).toEqual(error);
                        expect(matDialogRef.close).not.toHaveBeenCalled();
                    }));
                });
                it('and when getRecordBranch is rejected', fakeAsync(function() {
                    catalogManagerServiceStub.getRecordBranch.and.returnValue(throwError(error));
                    component.create();
                    tick();
                    expect(catalogManagerServiceStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId,
                        catalogId, component.createForm.value, ontologyStateServiceStub.listItem.versionedRdfRecord.commitId);
                    expect(catalogManagerServiceStub.getRecordBranch).toHaveBeenCalledWith(branchId,
                        ontologyStateServiceStub.listItem.versionedRdfRecord.recordId, catalogId);
                    expect(component.error).toEqual(error);
                    expect(matDialogRef.close).not.toHaveBeenCalled();
                }));
            });
            it('when createRecordBranch is rejected', fakeAsync(function() {
                catalogManagerServiceStub.createRecordBranch.and.returnValue(throwError(error));
                component.create();
                tick();
                expect(catalogManagerServiceStub.createRecordBranch).toHaveBeenCalledWith(ontologyStateServiceStub.listItem.versionedRdfRecord.recordId,
                    catalogId, component.createForm.value, ontologyStateServiceStub.listItem.versionedRdfRecord.commitId);
                expect(component.error).toEqual(error);
                expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
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