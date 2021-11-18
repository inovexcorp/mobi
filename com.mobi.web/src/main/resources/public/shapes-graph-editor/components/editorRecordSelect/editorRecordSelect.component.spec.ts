/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDialogModule } from '@angular/material';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { find } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM, mockCatalogManager, mockPrefixes, mockUtil, mockModal } from '../../../../../../test/ts/Shared';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { RecordSelectFiltered } from '../../models/recordSelectFiltered.interface';
import { NewShapesGraphRecordModalComponent } from '../newShapesGraphRecordModal/newShapesGraphRecordModal.component';
import { EditorRecordSelectComponent } from './editorRecordSelect.component';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';

describe('Editor Record Select component', function() {
    let component: EditorRecordSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditorRecordSelectComponent>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let shapesGraphStateStub;
    let prefixesStub;
    let catalogManagerStub;
    let modalStub;
    let shapesGraphManagerStub;

    const record1: RecordSelectFiltered = {
        title: 'Record One',
        recordId: 'record1'
    } as const;
    const record2: RecordSelectFiltered = {
        title: 'Record Two',
        recordId: 'record2'
    } as const;
    const record3: RecordSelectFiltered = {
        title: 'Record Three One',
        recordId: 'record3'
    } as const;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                MatAutocompleteModule,
                MatDividerModule
            ],
            declarations: [
                EditorRecordSelectComponent
            ],
            providers: [
                MockProvider(ShapesGraphStateService),
                MockProvider(ShapesGraphManagerService),
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'modalService', useClass: mockModal },
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    })
                }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(EditorRecordSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialog = TestBed.get(MatDialog);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.openRecords = [record1, record2];
        shapesGraphStateStub.currentShapesGraphRecordIri = '';
        shapesGraphStateStub.currentShapesGraphRecordTitle = '';
        shapesGraphStateStub.currentShapesGraphBranchIri = '';
        shapesGraphStateStub.currentShapesGraphCommitIri = '';
        shapesGraphStateStub.inProgressCommit = {
            additions: [],
            deletions: []
        };
        shapesGraphManagerStub = TestBed.get(ShapesGraphManagerService);
        prefixesStub = TestBed.get('prefixes');
        modalStub = TestBed.get('modalService');
        catalogManagerStub = TestBed.get('catalogManagerService');
        catalogManagerStub.localCatalog = {'@id': 'catalog'};
        catalogManagerStub.sortOptions = {field: prefixesStub.dcterms + 'title', asc: true};
        catalogManagerStub.getRecords.and.returnValue(Promise.resolve({
            data: [
                {'@id': record1.recordId},
                {'@id': record2.recordId},
                {'@id': record3.recordId}
            ]
        }));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialog = null;
        shapesGraphStateStub = null;
        prefixesStub = null;
        catalogManagerStub = null;
    });

    describe('controller methods', function() {
        it('should initialize by calling the correct methods', function() {
            spyOn<any>(component, 'setFilteredOptions');
            spyOn(component, 'resetSearch');
            component.ngOnInit();

            expect(component['setFilteredOptions']).toHaveBeenCalled();
            expect(component.resetSearch).toHaveBeenCalled();
        });
        it('should open the delete confirmation modal', function() {
            spyOn(component.autocompleteTrigger, 'closePanel');
            component.showDeleteConfirmationOverlay(record1, new Event('delete'));
            expect(modalStub.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to delete'), jasmine.any(Function));
            expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();

        });
        it('should filter records based on provided text', function() {
            component.unopened.push(record3);
            const result: any = component.filter('one');
            const open: any = find(result, {title: 'Open'});

            expect(open.options.length).toEqual(1);
            expect(open.options[0]).toEqual(record1);
            const unopened: any = find(result, {title: 'Unopened'});

            expect(unopened.options.length).toEqual(1);
            expect(unopened.options[0]).toEqual(record3);
        });
        it('should open create modal', function() {
            spyOn(component.autocompleteTrigger, 'closePanel');
            component.createShapesGraph(new Event('create'));

            expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
            expect(matDialog.open).toHaveBeenCalledWith(NewShapesGraphRecordModalComponent);
        });
        it('should select the record and update state', async function() {
            catalogManagerStub.getRecordMasterBranch.and.returnValue(Promise.resolve({
                "@id": "https://mobi.com/branches#a1111111111111111111111111",
                "@type": [
                    "http://www.w3.org/2002/07/owl#Thing",
                    "http://mobi.com/ontologies/catalog#Branch"
                ],
                "catalog:head": [
                    {
                        "@id": "https://mobi.com/commits#bbbbbbbbbbbbbbbbbbbbbbbbb"
                    }
                ]
            }));

            catalogManagerStub.getInProgressCommit.and.returnValue(Promise.resolve({
                "additions": [
                    {
                        "@id": "https://mobi.com/ontologies/a#First",
                        "@type": [
                            "http://www.w3.org/2002/07/owl#Class"
                        ],
                        "http://purl.org/dc/terms/title": [
                            {
                                "@value": "first"
                            }
                        ]
                    }
                ],
                "deletions": []
            }));

            shapesGraphStateStub.openRecords = [];

            expect(shapesGraphStateStub.currentShapesGraphRecordIri).toEqual('');
            expect(shapesGraphStateStub.currentShapesGraphBranchIri).toEqual('');
            expect(shapesGraphStateStub.currentShapesGraphCommitIri).toEqual('');
            expect(shapesGraphStateStub.currentShapesGraphRecordTitle).toEqual('');
            expect(shapesGraphStateStub.openRecords).toEqual([]);
            expect(shapesGraphStateStub.inProgressCommit).toEqual({
                additions: [],
                deletions: []
            });
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: record1
                }
            } as MatAutocompleteSelectedEvent;
            await component.selectRecord(event);

            expect(shapesGraphStateStub.currentShapesGraphRecordIri).toEqual(record1.recordId);
            expect(shapesGraphStateStub.currentShapesGraphRecordTitle).toEqual(record1.title);
            expect(shapesGraphStateStub.currentShapesGraphBranchIri).toEqual('https://mobi.com/branches#a1111111111111111111111111');
            expect(shapesGraphStateStub.currentShapesGraphCommitIri).toEqual('https://mobi.com/commits#bbbbbbbbbbbbbbbbbbbbbbbbb');
            expect(shapesGraphStateStub.inProgressCommit).toEqual({
                "additions": [
                    {
                        "@id": "https://mobi.com/ontologies/a#First",
                        "@type": [
                            "http://www.w3.org/2002/07/owl#Class"
                        ],
                        "http://purl.org/dc/terms/title": [
                            {
                                "@value": "first"
                            }
                        ]
                    }
                ],
                "deletions": []
            });
            expect(shapesGraphStateStub.openRecords).toEqual([record1]);
        });
        it('should reset the search value', function() {
            component.recordSearchControl.setValue('');
            shapesGraphStateStub.currentShapesGraphRecordTitle = 'Test';
            component.resetSearch();

            expect(component.recordSearchControl.value).toEqual('Test');
        });
        it('should retrieve shapes graph records', async function() {
            shapesGraphStateStub.openRecords = [record1];
            component.unopened = [];
            await component.retrieveShapesGraphRecords();

            expect(catalogManagerStub.getRecords).toHaveBeenCalledWith('catalog', jasmine.anything(), component.spinnerId);
            expect(shapesGraphStateStub.openRecords).toContain({ recordId: 'record1', title: '', description: '' });
        });
        it('should delete shapes graph record', function() {
            shapesGraphManagerStub.deleteShapesGraphRecord.and.returnValue(Promise.resolve({}));
            component.deleteShapesGraphRecord('record1');
            expect(shapesGraphManagerStub.deleteShapesGraphRecord).toHaveBeenCalledWith('record1');
        });
        it('should close shapes graph record', function() {
            shapesGraphStateStub.currentShapesGraphRecordTitle = 'this is a different title';
            shapesGraphStateStub.currentShapesGraphRecordIri = record1.recordId;
            shapesGraphStateStub.currentShapesGraphBranchIri = 'branch1';
            shapesGraphStateStub.currentShapesGraphCommitIri = 'commit1';
            shapesGraphStateStub.inProgressCommit = {
                additions: ['something'],
                deletions: []
            };
            spyOn<any>(component, 'setFilteredOptions');
            expect(shapesGraphStateStub.openRecords).toContain(record1);
            expect(component.unopened).not.toContain(record1);
            component.closeShapesGraphRecord(record1.recordId);

            expect(shapesGraphStateStub.openRecords).not.toContain(record1);
            expect(component.unopened).toContain(record1);
            expect(shapesGraphStateStub.currentShapesGraphRecordTitle).toEqual('');
            expect(shapesGraphStateStub.currentShapesGraphRecordIri).toEqual('');
            expect(shapesGraphStateStub.currentShapesGraphBranchIri).toEqual('');
            expect(shapesGraphStateStub.currentShapesGraphCommitIri).toEqual('');
            expect(shapesGraphStateStub.inProgressCommit).toEqual({
                additions: [],
                deletions: []
            });

            expect(component['setFilteredOptions']).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(1);
        });
        it('with an input for filtering', function() {
            const input = element.queryAll(By.css('input'));
            expect(input.length).toEqual(1);
        });
        describe('with a mat-autocomplete', function() {
            it('with an option for the create button', async function () {
                fixture.detectChanges();
                await fixture.whenStable();

                component.autocompleteTrigger.openPanel();
                fixture.detectChanges();
                await fixture.whenStable();

                const createButton = element.queryAll(By.css('button.create-record'));
                expect(createButton.length).toEqual(1);
            });
            it('with groups for open and unopened', async function () {
                fixture.detectChanges();
                await fixture.whenStable();

                component.autocompleteTrigger.openPanel();
                fixture.detectChanges();
                await fixture.whenStable();

                const labels = element.queryAll(By.css('.mat-optgroup-label'));
                expect(labels.length).toEqual(2);
                expect(labels[0].nativeElement.innerText).toEqual('Open');
                expect(labels[1].nativeElement.innerText).toEqual('Unopened');
            });
        });
    });
    it('should call createShapesGraph when the create button is clicked', async function() {
        spyOn(component, 'createShapesGraph');
        fixture.detectChanges();
        await fixture.whenStable();

        component.autocompleteTrigger.openPanel();
        fixture.detectChanges();
        await fixture.whenStable();

        const createButton = element.queryAll(By.css('button.create-record'))[0];
        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.createShapesGraph).toHaveBeenCalled();
    });
    it('should call showDeleteConfirmationOverlay when the delete button is clicked', async function() {
        spyOn(component, 'showDeleteConfirmationOverlay');
        fixture.detectChanges();
        await fixture.whenStable();

        component.autocompleteTrigger.openPanel();
        fixture.detectChanges();
        await fixture.whenStable();

        const createButton = element.queryAll(By.css('button.delete-record'))[0];
        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.showDeleteConfirmationOverlay).toHaveBeenCalled();
    });
    it('should select a record when clicked', async function() {
        spyOn(component, 'selectRecord');
        fixture.detectChanges();
        await fixture.whenStable();

        component.autocompleteTrigger.openPanel();
        fixture.detectChanges();
        await fixture.whenStable();

        const option = element.queryAll(By.css('mat-option'))[1]; // Open record
        option.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.selectRecord).toHaveBeenCalled();
    });
    it('should close a record when clicked', async function() {
        spyOn(component, 'closeShapesGraphRecord');
        fixture.detectChanges();
        await fixture.whenStable();

        component.autocompleteTrigger.openPanel();
        fixture.detectChanges();
        await fixture.whenStable();

        const close = element.queryAll(By.css('button.close-record'))[1]; // Close record
        close.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.closeShapesGraphRecord).toHaveBeenCalled();
    });
});
