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
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider, MockPipe } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CreateTagOverlayComponent } from './createTagOverlay.component';

describe('Create Tag Overlay component', function() {
    let component: CreateTagOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateTagOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateTagOverlayComponent>>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;
    let splitIRIStub: jasmine.SpyObj<SplitIRIPipe>;

    const error = 'error';
    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const ontologyId = 'http://test.com/ontology';

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
                MatIconModule
            ],
            declarations: [
                CreateTagOverlayComponent,
                MockComponent(ErrorDisplayComponent),
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(OntologyStateService),
                { provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe) },
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CreateTagOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateTagOverlayComponent>>;
        camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;
        splitIRIStub = TestBed.inject(SplitIRIPipe) as jasmine.SpyObj<SplitIRIPipe>;

        splitIRIStub.transform.and.returnValue({begin: 'http://test.com', then: '#', end: ''});
        catalogManagerStub.localCatalog = {'@id': catalogId};
        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
        ontologyStateStub.listItem.versionedRdfRecord.commitId = commitId;
        ontologyStateStub.listItem.versionedRdfRecord.branchId = branchId;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        ontologyStateStub = null;
        camelCaseStub = null;
        splitIRIStub = null;
        catalogManagerStub = null;
    });

    describe('should initialize correctly', function() {
        it('if the ontology id has a separator at the end already', function() {
            ontologyStateStub.listItem.ontologyId = ontologyId + '#';
            component.ngOnInit();
            expect(component.catalogId).toEqual(catalogId);
            expect(component.createForm.controls.iri.value).toEqual(ontologyId + '#');
        });
        it('if the ontology id does not have a separator at the end', function() {
            ontologyStateStub.listItem.ontologyId = ontologyId;
            component.ngOnInit();
            expect(component.catalogId).toEqual(catalogId);
            expect(component.createForm.controls.iri.value).toEqual(ontologyId + '/');

        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="iri"]', 'input[name="title"]'].forEach(function(item) {
            it('with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
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
    });
    describe('controller methods', function() {
        it('should set the correct state when the IRI is manually changed', function() {
            component.manualIRIEdit();
            expect(component.iriHasChanged).toBeTrue();
        });
        describe('should handle a title change', function() {
            beforeEach(function() {
                component.createForm.controls.iri.setValue(ontologyId + '#');
                camelCaseStub.transform.and.callFake(a => a);
            });
            it('if the iri has not been manually changed', function() {
                component.nameChanged('new');
                expect(component.createForm.controls.iri.value).toEqual('http://test.com#new');
                expect(splitIRIStub.transform).toHaveBeenCalledWith(ontologyId + '#');
                expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'class');
            });
            it('unless the iri has been manually changed', function() {
                component.iriHasChanged = true;
                component.nameChanged('new');
                expect(component.createForm.controls.iri.value).toEqual(ontologyId + '#');
                expect(splitIRIStub.transform).not.toHaveBeenCalled();
                expect(camelCaseStub.transform).not.toHaveBeenCalled();
            });
        });
        describe('create calls the correct methods', function() {
            const tag: JSONLDObject = {'@id': ontologyId};
            beforeEach(function() {
                component.catalogId = catalogId;
                component.createForm.controls.iri.setValue(ontologyId);
                component.createForm.controls.title.setValue('title');
            });
            describe('when createRecordTag is resolved', function() {
                beforeEach(function() {
                    catalogManagerStub.createRecordTag.and.returnValue(of(null));
                });
                describe('and getRecordVersion is resolved', function() {
                    beforeEach(function() {
                        catalogManagerStub.getRecordVersion.and.returnValue(of(tag));
                    });
                    it('and updateState is resolved', fakeAsync(function() {
                        ontologyStateStub.updateState.and.returnValue(of(null));
                        component.create();
                        tick();
                        expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith(recordId, catalogId, {iri: ontologyId, title: 'title', commitId});
                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(ontologyId, recordId, catalogId);
                        expect(ontologyStateStub.listItem.tags).toContain(tag);
                        expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId, commitId, tagId: ontologyId});
                        expect(component.error).toEqual('');
                        expect(matDialogRef.close).toHaveBeenCalledWith(true);
                    }));
                    it('and updateState is rejected', fakeAsync(function() {
                        ontologyStateStub.updateState.and.returnValue(throwError(error));
                        component.create();
                        tick();
                        expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith(recordId, catalogId, {iri: ontologyId, title: 'title', commitId});
                        expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(ontologyId, recordId, catalogId);
                        expect(ontologyStateStub.listItem.tags).toContain(tag);
                        expect(ontologyStateStub.updateState).toHaveBeenCalledWith({recordId, commitId, tagId: ontologyId});
                        expect(component.error).toEqual(error);
                        expect(matDialogRef.close).not.toHaveBeenCalled();
                    }));
                });
                it('and getRecordVersion is rejected', fakeAsync(function() {
                    catalogManagerStub.getRecordVersion.and.returnValue(throwError(error));
                    component.create();
                    tick();
                    expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith(recordId, catalogId, {iri: ontologyId, title: 'title', commitId});
                    expect(catalogManagerStub.getRecordVersion).toHaveBeenCalledWith(ontologyId, recordId, catalogId);
                    expect(ontologyStateStub.listItem.tags).not.toContain(tag);
                    expect(ontologyStateStub.updateState).not.toHaveBeenCalled();
                    expect(component.error).toEqual(error);
                    expect(matDialogRef.close).not.toHaveBeenCalled();
                }));
            });
            it('when createRecordTag is rejected', fakeAsync(function() {
                catalogManagerStub.createRecordTag.and.returnValue(throwError(error));
                component.create();
                tick();
                expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith(recordId, catalogId, {iri: ontologyId, title: 'title', commitId});
                expect(catalogManagerStub.getRecordVersion).not.toHaveBeenCalled();
                expect(ontologyStateStub.listItem.tags).not.toContain(tag);
                expect(ontologyStateStub.updateState).not.toHaveBeenCalled();
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
