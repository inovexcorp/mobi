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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { Difference } from '../../../shared/models/difference.class';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { RecordSelectFiltered } from '../../models/recordSelectFiltered.interface';
import { NewShapesGraphRecordModalComponent } from '../newShapesGraphRecordModal/newShapesGraphRecordModal.component';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { DCTERMS, POLICY } from '../../../prefixes';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../shared/services/toast.service';
import { EditorRecordSelectComponent, OptionGroup } from './editorRecordSelect.component';

describe('Editor Record Select component', function() {
    let component: EditorRecordSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditorRecordSelectComponent>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let shapesGraphStateStub;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let policyManagerStub;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const record1Item = new ShapesGraphListItem();
    const record2Item = new ShapesGraphListItem();
    const record3Item = new ShapesGraphListItem();

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

    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
                MockProvider(ToastService),
                MockProvider(PolicyEnforcementService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    })
                }
            ]
        }).compileComponents();

        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
        shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
        shapesGraphStateStub.deleteShapesGraph.and.returnValue(of(null));
        fixture = TestBed.createComponent(EditorRecordSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
        policyEnforcementStub.evaluateMultiDecisionRequest.and.returnValue(of([
            {
              'urn:oasis:names:tc:xacml:3.0:attribute-category:resource': 'record3',
              'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject': 'urn:testUser',
              'urn:oasis:names:tc:xacml:3.0:attribute-category:action': `${POLICY}Delete`,
              'decision': 'Permit'
            }
          ]));

        record1Item.versionedRdfRecord.recordId = record1.recordId;
        record1Item.versionedRdfRecord.title = record1.title;
        record2Item.versionedRdfRecord.recordId = record2.recordId;
        record2Item.versionedRdfRecord.title = record2.title;
        record3Item.versionedRdfRecord.recordId = record3.recordId;
        record3Item.versionedRdfRecord.title = record3.title;
        shapesGraphStateStub.list = [record1Item, record2Item];
        shapesGraphStateStub.openShapesGraph.and.returnValue(of(null));
        shapesGraphStateStub.closeShapesGraph.and.callFake(ShapesGraphStateService.prototype.closeShapesGraph);

        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        policyManagerStub = TestBed.inject(PolicyManagerService) as jasmine.SpyObj<PolicyManagerService>;
        policyManagerStub.actionDelete = `${POLICY}Delete`;

        catalogManagerStub.sortOptions = [{field: `${DCTERMS}title`, asc: true, label: ''}];
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({
            body: [
                {'@id': record1.recordId, '@type': [], [`${DCTERMS}title`]: [{ '@value': record1.title }]},
                {'@id': record2.recordId, '@type': [], [`${DCTERMS}title`]: [{ '@value': record2.title }]},
                {'@id': record3.recordId, '@type': [], [`${DCTERMS}title`]: [{ '@value': record3.title }]}
            ]
        })));
        component.recordIri = record1.recordId;
        policyEnforcementStub.deny = 'Deny';
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
            expect(component.textInput.nativeElement.blur).toHaveBeenCalledWith();
            expect(component.resetSearch).toHaveBeenCalledWith();
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
            expect(component.resetSearch).toHaveBeenCalledWith();
            expect(component.recordSearchControl.setValue).toHaveBeenCalledWith('newRecordId');
        });
        it('should open the delete confirmation modal', function() {
            spyOn(component.autocompleteTrigger, 'closePanel');
            component.showDeleteConfirmationOverlay(record1, new Event('delete'));
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to delete')}});
            expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();

        });
        it('should filter records based on provided text', async function() {
            await component.ngOnInit();
            const result: OptionGroup[] = component.filter('one');
            const open: OptionGroup = find(result, {title: 'Open'});

            expect(open.options.length).toEqual(1);
            expect(open.options[0]).toEqual(record1);
            const unopened: OptionGroup = find(result, {title: 'Unopened'});

            expect(unopened.options.length).toEqual(1);
            expect(unopened.options[0]).toEqual(record3);
        });
        it('should open create modal', function() {
            spyOn(component.autocompleteTrigger, 'closePanel');
            component.createShapesGraph(new Event('create'));

            expect(component.autocompleteTrigger.closePanel).toHaveBeenCalledWith();
            expect(matDialog.open).toHaveBeenCalledWith(NewShapesGraphRecordModalComponent);
        });
        it('should select the record and update state', fakeAsync(function() {
            component.ngOnInit();
            tick();
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
            component.selectRecord(event);
            tick();
            expect(component.opened.length).toEqual(3);
            expect(component.unopened.length).toEqual(0);
            expect(component.opened).toContain(record3);
            expect(component.unopened).not.toContain(record3);
            expect(shapesGraphStateStub.openShapesGraph).toHaveBeenCalledWith(record3);
            expect(component.recordSearchControl.setValue).toHaveBeenCalledWith(record3.title);
        }));
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
                    'resourceId': [
                      'record3'
                    ],
                    'actionId': [
                      `${POLICY}Delete`
                    ]
                  }, jasmine.anything());
            });
            it('when user does not have permission to delete a record', async function() {
                policyEnforcementStub.evaluateMultiDecisionRequest.and.returnValue(of([
                    {
                      'urn:oasis:names:tc:xacml:3.0:attribute-category:resource': 'record3',
                      'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject': 'urn:testUser',
                      'urn:oasis:names:tc:xacml:3.0:attribute-category:action': `${POLICY}Delete`,
                      'decision': 'Deny'
                    }
                  ]));

                await component.retrieveShapesGraphRecords();
                fixture.detectChanges();
                await fixture.whenStable();
    
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith('catalog', jasmine.anything(), true);
                expect(shapesGraphStateStub.list).toContain(record1Item, record2Item);
                expect(policyEnforcementStub.evaluateMultiDecisionRequest).toHaveBeenCalledWith({
                    'resourceId': [
                      'record3'
                    ],
                    'actionId': [
                      `${POLICY}Delete`
                    ]
                  }, jasmine.anything());
                expect(component.unopened.length).toEqual(1);
                expect(component.unopened[0]['canNotDelete']).toEqual(true);
            });
        });
        
        describe('should delete shapes graph record', function() {
            it('successfully', async function() {
                shapesGraphStateStub.deleteShapesGraph.and.returnValue(of(null));
                await component.deleteShapesGraphRecord('record1');
                expect(shapesGraphStateStub.deleteShapesGraph).toHaveBeenCalledWith('record1');
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
            });
            it('unless an error occurs', async function() {
                shapesGraphStateStub.deleteShapesGraph.and.returnValue(throwError('error'));
                await component.deleteShapesGraphRecord('record1');
                expect(shapesGraphStateStub.deleteShapesGraph).toHaveBeenCalledWith('record1');
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
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

            expect(component['setFilteredOptions']).toHaveBeenCalledWith();
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
        expect(component.showDeleteConfirmationOverlay).toHaveBeenCalledWith(jasmine.any(Object), null);
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
