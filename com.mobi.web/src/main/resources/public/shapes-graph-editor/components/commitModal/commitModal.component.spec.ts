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
import { MatButtonModule, MatDialogModule, MatDialogRef } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { get } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CATALOG } from '../../../prefixes';
import { UtilService } from '../../../shared/services/util.service';
import { CommitModalComponent } from './commitModal.component';

describe('Commit Modal component', function() {
    let component: CommitModalComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitModalComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CommitModalComponent>>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    
    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule,
                MatChipsModule,
                MatIconModule
            ],
            declarations: [
                CommitModalComponent,
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                MockProvider(CatalogManagerService),
                MockProvider(UtilService),
                MockProvider(ShapesGraphStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CommitModalComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };
        shapesGraphStateStub.changeShapesGraphVersion.and.resolveTo();
        component.catalogId = 'catalog';
        catalogManagerStub = TestBed.get(CatalogManagerService);
        catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
        catalogManagerStub.getRecordBranch.and.returnValue(of(
            {
                '@id': 'id',
                '@type': [],
                [CATALOG + 'head']: [{'@id': 'commit1'}]
            } as JSONLDObject));
        utilStub = TestBed.get(UtilService);
        utilStub.getPropertyId.and.callFake((obj, prop) => get(obj, '[\'' + prop + '\'][0][\'@id\']'));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        shapesGraphStateStub = null;
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        describe('should commit changes on a shapes graph record and close the dialog',  function() {
            it('successfully', async function() {
                catalogManagerStub.createBranchCommit.and.returnValue(of('urn:newCommitIri'));
                shapesGraphStateStub.listItem.versionedRdfRecord.commitId = 'urn:originalCommitIri';
                component.createCommitForm.controls['comment'].setValue('testComment');
                component.createCommit('branch1');
                fixture.detectChanges();
                await fixture.whenStable();

                expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith('branch1', 'record1', 'catalog', 'testComment');
                expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('record1', 'branch1', 'urn:newCommitIri', undefined, undefined, true, false);
                expect(matDialogRef.close).toHaveBeenCalledWith(true);
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.createBranchCommit.and.returnValue(throwError('There was an error'));
                shapesGraphStateStub.listItem.versionedRdfRecord.commitId = 'urn:originalCommitIri';
                component.createCommitForm.controls['comment'].setValue('testComment');
                component.createCommit('branch1');
                fixture.detectChanges();
                await fixture.whenStable();

                expect(catalogManagerStub.createBranchCommit).toHaveBeenCalledWith('branch1', 'record1', 'catalog', 'testComment');
                expect(shapesGraphStateStub.changeShapesGraphVersion).not.toHaveBeenCalled();
                expect(shapesGraphStateStub.listItem.versionedRdfRecord.commitId).toEqual('urn:originalCommitIri');
                expect(component.errorMessage).toEqual('There was an error');
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
        });
        describe('should create a commit if',  function() {
            describe('getRecordBranch', function() {
                describe('returns successfully', function() {
                    it('the branch is up to date', fakeAsync(function() {
                        spyOn(component, 'createCommit');
                        component.commit();
                        tick();
                        expect(component.createCommit).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.branchId);
                        expect(shapesGraphStateStub.listItem.upToDate).toBeTrue();
                        expect(component.errorMessage).toEqual('');
                    }));
                    it('not create a commit if the branch is up to date', fakeAsync(function() {
                        catalogManagerStub.getRecordBranch.and.returnValue(of(
                            {
                                '@id': 'id',
                                '@type': [],
                                [CATALOG + 'head']: [{'@id': 'commit2'}]
                            } as JSONLDObject));
                        spyOn(component, 'createCommit');
                        component.commit();
                        tick();
                        expect(component.createCommit).not.toHaveBeenCalled();
                        expect(component.errorMessage).toEqual('Cannot commit. Branch is behind HEAD. Please update.');
                    }));
                });
                it('rejects', fakeAsync(function() {
                    spyOn(component, 'createCommit');
                    catalogManagerStub.getRecordBranch.and.returnValue(throwError('Error'));
                    component.commit();
                    tick();
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                    expect(component.createCommit).not.toHaveBeenCalled();
                    expect(component.errorMessage).toEqual('');
                }));
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('.shapes-graph-commit-modal')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('textarea')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('when there is an error', async function() {
            let errorDisplay = element.queryAll(By.css('error-display'));
            expect(errorDisplay.length).toEqual(0);

            component.errorMessage = 'error';
            fixture.detectChanges();
            await fixture.whenStable();
            errorDisplay = element.queryAll(By.css('error-display'));

            expect(errorDisplay.length).toBe(1);
            expect(errorDisplay[0].nativeElement.innerText).toEqual('error');
        });
    });
    it('should call commit when the submit button is clicked', function() {
        spyOn(component, 'commit');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.commit).toHaveBeenCalledWith();
    });
});
