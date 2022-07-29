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
import { HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDialogModule, MatProgressSpinnerModule } from '@angular/material';
import { MatTooltipModule } from '@angular/material/tooltip';
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

import { cleanStylesFromDOM, mockUtil, mockModal, mockPolicyEnforcement } from '../../../../../../test/ts/Shared';
import { Difference } from '../../../shared/models/difference.class';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { RecordSelectFiltered } from '../../models/recordSelectFiltered.interface';
import { NewShapesGraphRecordModalComponent } from '../newShapesGraphRecordModal/newShapesGraphRecordModal.component';
import { EditorRecordSelectComponent } from './editorRecordSelect.component';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { DCTERMS } from '../../../prefixes';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';

describe('Editor Record Select component', function() {
    let component: EditorRecordSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditorRecordSelectComponent>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let shapesGraphStateStub;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let policyManagerStub;
    let policyEnforcementStub;
    let utilStub;

    let record1Item = new ShapesGraphListItem();
    let record2Item = new ShapesGraphListItem();
    let record3Item = new ShapesGraphListItem();

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
                MatDividerModule,
                MatProgressSpinnerModule,
                MatTooltipModule
            ],
            declarations: [
                EditorRecordSelectComponent
            ],
            providers: [
                MockProvider(ShapesGraphStateService),
                MockProvider(CatalogManagerService),
                MockProvider(ShapesGraphManagerService),
                MockProvider(ProgressSpinnerService),
                MockProvider(PolicyManagerService),
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'modalService', useClass: mockModal },
                { provide: 'policyEnforcementService', useClass: mockPolicyEnforcement },
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    })
                }
            ]
        });
    });

    beforeEach(function() {
        catalogManagerStub = TestBed.get(CatalogManagerService);
        catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.deleteShapesGraph.and.resolveTo({});
        fixture = TestBed.createComponent(EditorRecordSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialog = TestBed.get(MatDialog);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        policyEnforcementStub = TestBed.get('policyEnforcementService')
        policyEnforcementStub.evaluateMultiDecisionRequest.and.returnValue([
            {
              "urn:oasis:names:tc:xacml:3.0:attribute-category:resource": "record3",
              "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject": "urn:testUser",
              "urn:oasis:names:tc:xacml:3.0:attribute-category:action": "http://mobi.com/ontologies/policy#Delete",
              "decision": "Permit"
            }
          ]);

        record1Item.versionedRdfRecord.recordId = record1.recordId;
        record1Item.versionedRdfRecord.title = record1.title;
        record2Item.versionedRdfRecord.recordId = record2.recordId;
        record2Item.versionedRdfRecord.title = record2.title;
        record3Item.versionedRdfRecord.recordId = record3.recordId;
        record3Item.versionedRdfRecord.title = record3.title;
        shapesGraphStateStub.list = [record1Item, record2Item];
        shapesGraphStateStub.openShapesGraph.and.resolveTo();
        shapesGraphStateStub.closeShapesGraph.and.callFake(ShapesGraphStateService.prototype.closeShapesGraph);

        utilStub = TestBed.get('utilService');

        policyManagerStub = TestBed.get(PolicyManagerService);
        policyManagerStub.actionDelete = 'http://mobi.com/ontologies/policy#Delete';

        catalogManagerStub.sortOptions = [{field: DCTERMS + 'title', asc: true, label: ''}];
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({
            body: [
                {'@id': record1.recordId, '@type': [], 'title': record1.title},
                {'@id': record2.recordId, '@type': [], 'title': record2.title},
                {'@id': record3.recordId, '@type': [], 'title': record3.title}
            ]
        })));
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
        policyEnforcementStub = null;
        policyManagerStub = null;
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

            expect(component['setFilteredOptions']).toHaveBeenCalledWith();
            expect(component.resetSearch).toHaveBeenCalledWith();
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
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to delete')}});
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

            expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
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
        describe('should retrieve shapes graph records', function() {
            it('successfully', async function() {
                shapesGraphStateStub.list = [record1Item];
                component.unopened = [];
                await component.retrieveShapesGraphRecords();
                
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith('catalog', jasmine.anything(), true);
                expect(shapesGraphStateStub.list).toContain(record1Item);
            });
            it('when an unopened record exists', async function() {
                await component.retrieveShapesGraphRecords();
    
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith('catalog', jasmine.anything(), true);
                expect(shapesGraphStateStub.list).toContain(record1Item, record2Item);
                expect(policyEnforcementStub.evaluateMultiDecisionRequest).toHaveBeenCalledWith({
                    "resourceId": [
                      "record3"
                    ],
                    "actionId": [
                      "http://mobi.com/ontologies/policy#Delete"
                    ]
                  }, jasmine.anything());
            });
            it('when user does not have permission to delete a record', async function() {
                policyEnforcementStub.evaluateMultiDecisionRequest.and.returnValue([
                    {
                      "urn:oasis:names:tc:xacml:3.0:attribute-category:resource": "record3",
                      "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject": "urn:testUser",
                      "urn:oasis:names:tc:xacml:3.0:attribute-category:action": "http://mobi.com/ontologies/policy#Delete",
                      "decision": "Deny"
                    }
                  ]);

                await component.retrieveShapesGraphRecords();
                fixture.detectChanges();
                await fixture.whenStable();
    
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith('catalog', jasmine.anything(), true);
                expect(shapesGraphStateStub.list).toContain(record1Item, record2Item);
                expect(policyEnforcementStub.evaluateMultiDecisionRequest).toHaveBeenCalledWith({
                    "resourceId": [
                      "record3"
                    ],
                    "actionId": [
                      "http://mobi.com/ontologies/policy#Delete"
                    ]
                  }, jasmine.anything());
                expect(component.unopened.length).toEqual(1);
                expect(component.unopened[0]['canNotDelete']).toEqual(true);
            });
        });
        
        describe('should delete shapes graph record', function() {
            it('successfully', async function() {
                shapesGraphStateStub.deleteShapesGraph.and.resolveTo({});
                await component.deleteShapesGraphRecord('record1');
                expect(shapesGraphStateStub.deleteShapesGraph).toHaveBeenCalledWith('record1');
                expect(utilStub.createSuccessToast).toHaveBeenCalled();
            });
            it('unless an error occurs', async function() {
                shapesGraphStateStub.deleteShapesGraph.and.rejectWith('error');
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
        expect(component.createShapesGraph).toHaveBeenCalledWith(null);
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
        expect(component.selectRecord).toHaveBeenCalledWith(jasmine.any(MatAutocompleteSelectedEvent));
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
        expect(component.closeShapesGraphRecord).toHaveBeenCalledWith(jasmine.any(String));
    });
});
