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
import { Difference } from '../../../shared/models/difference.class';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
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
    let utilStub;

    let record1Item = new ShapesGraphListItem();
    let record2Item = new ShapesGraphListItem();

    const record1: RecordSelectFiltered = {
        title: 'Record One',
        recordId: 'record1',
        description: ''
    } as const;
    const record2: RecordSelectFiltered = {
        title: 'Record Two',
        recordId: 'record2',
        description: ''
    } as const;
    const record3: RecordSelectFiltered = {
        title: 'Record Three One',
        recordId: 'record3',
        description: ''
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
        shapesGraphStateStub.listItem = new ShapesGraphListItem();

        record1Item.versionedRdfRecord.recordId = record1.recordId;
        record1Item.versionedRdfRecord.title = record1.title;
        record2Item.versionedRdfRecord.recordId = record2.recordId;
        record2Item.versionedRdfRecord.title = record2.title;
        shapesGraphStateStub.list = [record1Item, record2Item];
        shapesGraphStateStub.openShapesGraph.and.returnValue(Promise.resolve());
        shapesGraphStateStub.closeShapesGraph.and.callFake(ShapesGraphStateService.prototype.closeShapesGraph);

        shapesGraphManagerStub = TestBed.get(ShapesGraphManagerService);
        prefixesStub = TestBed.get('prefixes');
        modalStub = TestBed.get('modalService');
        catalogManagerStub = TestBed.get('catalogManagerService');
        catalogManagerStub.localCatalog = {'@id': 'catalog'};
        catalogManagerStub.sortOptions = {field: prefixesStub.dcterms + 'title', asc: true};
        catalogManagerStub.getRecords.and.returnValue(Promise.resolve({
            data: [
                {'@id': record1.recordId, 'title': record1.title},
                {'@id': record2.recordId, 'title': record2.title},
                {'@id': record3.recordId, 'title': record3.title}
            ]
        }));

        utilStub = TestBed.get('utilService');
        utilStub.getDctermsValue.and.callFake((obj, prop) => {
            if (prop === 'title') {
                return obj.title;
            } else {
                return '';
            }
        });
        component.recordIri = record1.recordId;
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

    describe('should initialize with the correct data for', function() {
        it('recordIri', function() {
            expect(component.recordIri).toEqual(record1.recordId);
        });
    });
    describe('controller methods', function() {
        it('should initialize by calling the correct methods', function() {
            spyOn<any>(component, 'setFilteredOptions');
            spyOn(component, 'resetSearch');
            component.ngOnInit();

            expect(component['setFilteredOptions']).toHaveBeenCalled();
            expect(component.resetSearch).toHaveBeenCalled();
        });
        it('should blur the input and call reset search on close', function() {
            spyOn(component, 'resetSearch');
            spyOn(component.textInput.nativeElement, 'blur');
            component.close();
            expect(component.textInput.nativeElement.blur).toHaveBeenCalled();
            expect(component.resetSearch).toHaveBeenCalled();
        });
        it('should change reset the search if the record has changed', function() {
            expect(component.recordIri).toEqual(record1.recordId);
            spyOn(component, 'resetSearch').and.callThrough();
            spyOn(component.recordSearchControl, 'setValue');
            shapesGraphStateStub.listItem.versionedRdfRecord.title = 'newRecordId';
            component.ngOnChanges({
                recordIri: {
                    currentValue: 'newRecordId',
                    previousValue: 'recordId',
                    firstChange: false,
                    isFirstChange(): boolean {
                        return false;
                    }
                }
            });
            expect(component.resetSearch).toHaveBeenCalled();
            expect(component.recordSearchControl.setValue).toHaveBeenCalledWith('newRecordId');
        });
        it('should open the delete confirmation modal', function() {
            spyOn(component.autocompleteTrigger, 'closePanel');
            component.showDeleteConfirmationOverlay(record1, new Event('delete'));
            expect(modalStub.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to delete'), jasmine.any(Function));
            expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();

        });
        it('should filter records based on provided text', async function() {
            await component.ngOnInit();
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
            await component.ngOnInit();
            spyOn(component.recordSearchControl, 'setValue');
            expect(component.opened.length).toEqual(2);
            expect(component.unopened.length).toEqual(1);
            expect(component.opened).not.toContain(record3);
            expect(component.unopened).toContain(record3);
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: record3
                }
            } as MatAutocompleteSelectedEvent;
            await component.selectRecord(event);
            expect(component.opened.length).toEqual(3);
            expect(component.unopened.length).toEqual(0);
            expect(component.opened).toContain(record3);
            expect(component.unopened).not.toContain(record3);
            expect(shapesGraphStateStub.openShapesGraph).toHaveBeenCalledWith(record3);
            expect(component.recordSearchControl.setValue).toHaveBeenCalledWith(record3.title);

        });
        it('should reset the search value', function() {
            component.recordSearchControl.setValue('');
            shapesGraphStateStub.listItem.versionedRdfRecord.title = 'Test';
            component.resetSearch();

            expect(component.recordSearchControl.value).toEqual('Test');
        });
        it('should retrieve shapes graph records', async function() {
            shapesGraphStateStub.list = [record1Item];
            component.unopened = [];
            await component.retrieveShapesGraphRecords();

            expect(catalogManagerStub.getRecords).toHaveBeenCalledWith('catalog', jasmine.anything(), component.spinnerId);
            expect(shapesGraphStateStub.list).toContain(record1Item);
        });
        describe('should delete shapes graph record', function() {
            it('successfully', async function() {
                shapesGraphStateStub.deleteShapesGraph.and.returnValue(Promise.resolve({}));
                await component.deleteShapesGraphRecord('record1');
                expect(shapesGraphStateStub.deleteShapesGraph).toHaveBeenCalledWith('record1');
                expect(utilStub.createSuccessToast).toHaveBeenCalled();
            });
            it('unless an error occurs', async function() {
                shapesGraphStateStub.deleteShapesGraph.and.returnValue(Promise.reject('error'));
                await component.deleteShapesGraphRecord('record1');
                expect(shapesGraphStateStub.deleteShapesGraph).toHaveBeenCalledWith('record1');
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('should close shapes graph record', async function() {
            await component.ngOnInit();
            spyOn<any>(component, 'setFilteredOptions');

            shapesGraphStateStub.listItem.versionedRdfRecord.title = 'this is a different title';
            shapesGraphStateStub.listItem.versionedRdfRecord.recordId = record1.recordId;
            shapesGraphStateStub.listItem.versionedRdfRecord.branchId = 'branch1';
            shapesGraphStateStub.listItem.versionedRdfRecord.commitId = 'commit1';
            shapesGraphStateStub.listItem.inProgressCommit = new Difference();
            shapesGraphStateStub.listItem.inProgressCommit.additions.push({
                '@id': 'something'
            });

            expect(shapesGraphStateStub.list).toContain(record1Item);
            expect(component.unopened).not.toContain(record1);
            component.closeShapesGraphRecord(record1.recordId);

            expect(shapesGraphStateStub.list).not.toContain(record1Item);
            expect(component.unopened).toContain(record1);
            expect(shapesGraphStateStub.listItem.versionedRdfRecord.title).toEqual('');
            expect(shapesGraphStateStub.listItem.versionedRdfRecord.recordId).toEqual('');
            expect(shapesGraphStateStub.listItem.versionedRdfRecord.branchId).toEqual('');
            expect(shapesGraphStateStub.listItem.versionedRdfRecord.commitId).toEqual('');
            expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(new Difference());

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
