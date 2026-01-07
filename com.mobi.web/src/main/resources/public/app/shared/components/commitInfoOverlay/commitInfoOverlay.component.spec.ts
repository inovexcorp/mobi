/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider, MockDirective } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { CopyClipboardDirective } from '../../directives/copyClipboard/copyClipboard.directive';
import { CommitDifference } from '../../models/commitDifference.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { CommitChangesDisplayComponent } from '../commitChangesDisplay/commitChangesDisplay.component';
import { OntologyManagerService } from '../../services/ontologyManager.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { ToastService } from '../../services/toast.service';
import { Commit } from '../../models/commit.interface';
import { ONTOLOGYEDITOR } from '../../../prefixes';
import { CommitInfoOverlayComponent } from './commitInfoOverlay.component';

describe('Commit Info Overlay component', function() {
    let component: CommitInfoOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitInfoOverlayComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let dialogStub: jasmine.SpyObj<MatDialogRef<CommitInfoOverlayComponent>>;
    let difference: CommitDifference;
    let headers;
    
    const commitId = 'commitId';
    const recordId = 'recordId';
    const emptyObj: JSONLDObject = {'@id': '', '@type': []};
    const data: {commit: Commit, recordId: string, type: string} = {
        commit: {
            id: commitId,
            condensedId: commitId,
            creator: undefined,
            date: '',
            message: '',
            base: '',
            auxiliary: '',
            branch: ''
        },
        recordId,
        type: `${ONTOLOGYEDITOR}OntologyRecord`
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatDialogModule
            ],
            declarations: [
                CommitInfoOverlayComponent,
                MockComponent(CommitChangesDisplayComponent),
                MockDirective(CopyClipboardDirective)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(OntologyManagerService),
                MockProvider(ToastService),
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                MockProvider(UserManagerService)
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CommitInfoOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        difference = new CommitDifference();
        headers = {'has-more-results': 'false'};
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        dialogStub = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CommitInfoOverlayComponent>>;
        catalogManagerStub.getDifference.and.returnValue(of(new HttpResponse({body: difference, headers: new HttpHeaders(headers)})));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
        ontologyManagerStub = null;
        toastStub = null;
    });

    describe('should initialize with the correct value for', function() {
        it('data', function() {
            expect(component.data).toEqual(data);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('depending on whether there are additions and deletions', async function() {
            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('.changes-container p')).length).toEqual(1);
            expect(element.queryAll(By.css('.changes-container commit-changes-display')).length).toEqual(0);

            component.additions = [emptyObj];
            component.deletions = [];
            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('.changes-container p')).length).toEqual(0);
            expect(element.queryAll(By.css('.changes-container commit-changes-display')).length).toEqual(1);

            component.additions = [];
            component.deletions = [emptyObj];
            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('.changes-container p')).length).toEqual(0);
            expect(element.queryAll(By.css('.changes-container commit-changes-display')).length).toEqual(1);
        });
        it('with a button to cancel', function() {
            const buttons = element.queryAll(By.css('button[mat-raised-button]'));
            expect(buttons.length).toEqual(1);
            expect(buttons[0].nativeElement.innerHTML).toEqual('Cancel');
        });
    });
    describe('controller methods', function() {
        it('should cancel the overlay', async function() {
            component.cancel();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(dialogStub.close).toHaveBeenCalledWith(false);
        });
        describe('should update additions and deletions', function() {
            describe('if getDifference resolves', function() {
                beforeEach(function() {
                    headers = {'has-more-results': 'true'};
                    const data = new CommitDifference();
                    data.additions = [{'@id': 'iri1', '@type': []}];
                    data.commit = {'@id': commitId, '@type': []};
                    catalogManagerStub.getDifference.and.returnValue(of(new HttpResponse<CommitDifference>({body: data, headers: new HttpHeaders(headers)})));
                });
                describe('and resolve.recordId is set', function() {
                    beforeEach( async function() {
                        component.data = {
                            commit: {
                                'id': '123',
                                creator: undefined,
                                date: '',
                                message: '',
                                base: '',
                                auxiliary: '',
                                branch: ''
                            },
                            recordId: 'recordId',
                            type: ONTOLOGYEDITOR + 'OntologyRecord'
                        };
                        fixture.detectChanges();
                        await fixture.whenStable();
                    });
                    describe('and getOntologyEntityNames', function() {
                        it('resolves', async function() {
                            ontologyManagerStub.getOntologyEntityNames.and.returnValue(of({'iri1': {label: 'label', names: []}}));
                            await component.retrieveMoreResults(100, 0);

                            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                            expect(ontologyManagerStub.getOntologyEntityNames).toHaveBeenCalledWith('recordId', '', '123', false, false, ['iri1']);
                            expect(component.additions).toEqual([{'@id': 'iri1', '@type': []}]);
                            expect(component.deletions).toEqual([]);
                            expect(component.hasMoreResults).toEqual(true);
                            expect(component.entityNames).toEqual({'iri1': {label: 'label', names: []}});
                        });
                        it('rejects', async function() {
                            ontologyManagerStub.getOntologyEntityNames.and.returnValue(throwError('Error Message'));
                            await component.retrieveMoreResults(100, 0);

                            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                            expect(ontologyManagerStub.getOntologyEntityNames).toHaveBeenCalledWith('recordId', '', '123', false, false, ['iri1']);
                            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
                        });
                    });
                });
                it('and resolve.recordId is not set', async function() {
                    component.data = {
                        commit: {
                            'id': '123',
                            creator: undefined,
                            date: '',
                            message: '',
                            base: '',
                            auxiliary: '',
                            branch: ''
                        },
                        recordId: '',
                        type: ''
                    };
                    expect(component.additions).toEqual([]);
                    fixture.detectChanges();
                    await fixture.whenStable();

                    expect(component.additions).toEqual([{'@id': 'iri1', '@type': []}]);
                    await component.retrieveMoreResults(100, 0);
                    expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                    expect(component.additions).toEqual([{'@id': 'iri1', '@type': []}, {'@id': 'iri1', '@type': []}]);
                    expect(component.deletions).toEqual([]);
                    expect(component.hasMoreResults).toEqual(true);
                    expect(component.entityNames).toEqual({});
                });
            });
            it('unless getDifference rejects', async function() {
                component.data = {
                    commit: {
                        'id': '123',
                        creator: undefined,
                        date: '',
                        message: '',
                        base: '',
                        auxiliary: '',
                        branch: ''
                    },
                    recordId: '',
                    type: ''
                };
                fixture.detectChanges();
                await fixture.whenStable();

                catalogManagerStub.getDifference.and.returnValue(throwError('Error Message'));
                await component.retrieveMoreResults(100, 0);
                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
        describe('getEntityName returns when the calculated entityName', function() {
            it('exists', function() {
                component.entityNames['iri'] = {label: 'iriLabel', names: []};
                expect(component.getEntityName('iri')).toEqual('iriLabel');
            });
            it('does not exist', function() {
                component.entityNames = undefined;
                expect(component.getEntityName('iri')).toEqual('Iri');
            });
        });
    });
});
