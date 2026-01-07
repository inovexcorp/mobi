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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { cloneDeep } from 'lodash';

import { CATALOG, DCTERMS, POLICY } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogRecordKeywordsComponent } from '../catalogRecordKeywords/catalogRecordKeywords.component';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { cleanStylesFromDOM, DATE_STR, SHORT_DATE_STR } from '../../../../../public/test/ts/Shared';
import { EntityPublisherComponent } from '../entityPublisher/entityPublisher.component';
import { InlineEditComponent } from '../../../shared/components/inlineEdit/inlineEdit.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { LimitDescriptionComponent } from '../../../shared/components/limitDescription/limitDescription.component';
import { ManageRecordButtonComponent } from '../manageRecordButton/manageRecordButton.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OpenRecordButtonComponent } from '../openRecordButton/openRecordButton.component';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { RecordViewTabsetComponent } from '../recordViewTabset/recordViewTabset.component';
import { ToastService } from '../../../shared/services/toast.service';
import { RecordViewComponent } from './recordView.component';

describe('Record View component', function() {
    let component: RecordViewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordViewComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const record: JSONLDObject = {
      '@id': recordId,
      '@type': [],
      [`${DCTERMS}title`]: [{ '@value': 'title' }],
      [`${DCTERMS}description`]: [{ '@value': 'description' }],
      [`${DCTERMS}modified`]: [{ '@value': DATE_STR }],
      [`${DCTERMS}issued`]: [{ '@value': DATE_STR }],
      [`${CATALOG}catalog`]: [{ '@id': catalogId }]
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                MatButtonModule,
             ],
            declarations: [
                RecordViewComponent,
                MockComponent(InlineEditComponent),
                MockComponent(EntityPublisherComponent),
                MockComponent(RecordViewTabsetComponent),
                MockComponent(RecordIconComponent),
                MockComponent(CatalogRecordKeywordsComponent),
                MockComponent(LimitDescriptionComponent),
                MockComponent(OpenRecordButtonComponent),
                MockComponent(ManageRecordButtonComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(CatalogStateService),
                MockProvider(OntologyStateService),
                MockProvider(PolicyEnforcementService),
                MockProvider(ToastService),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RecordViewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        catalogStateStub = TestBed.inject(CatalogStateService) as jasmine.SpyObj<CatalogStateService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';

        catalogStateStub.selectedRecord = record;
        catalogManagerStub.getRecord.and.returnValue(of([record]));
        catalogManagerStub.getRecordStatistics.and.returnValue(of([]));
        catalogManagerStub.updateRecord.and.returnValue(of([record]));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
        catalogStateStub = null;
        ontologyStateStub = null;
        policyEnforcementStub = null;
        toastStub = null;
    });

    describe('should initialize', function() {
        beforeEach(function() {
            catalogStateStub.selectedRecord = record;
            spyOn(component, 'setInfo');
            spyOn(component, 'setCanEdit');
        });
        it('if the record is found', function() {
            component.ngOnInit();
            expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
            expect(catalogManagerStub.getRecordStatistics).toHaveBeenCalledWith(recordId, catalogId);
            expect(component.setInfo).toHaveBeenCalledWith([record]);
            expect(component.setCanEdit).toHaveBeenCalledWith();
            expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            expect(catalogStateStub.selectedRecord).toEqual(record);
            expect(component.statistics).toEqual([]);
        });
        it('unless the record is not found', function() {
            catalogManagerStub.getRecord.and.returnValue(throwError('Error message'));
            component.ngOnInit();
            expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
            expect(catalogManagerStub.getRecordStatistics).toHaveBeenCalledWith(recordId, catalogId);
            expect(component.setInfo).not.toHaveBeenCalled();
            expect(component.setCanEdit).not.toHaveBeenCalled();
            expect(catalogStateStub.selectedRecord).toBeUndefined();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
            expect(component.statistics).toEqual([]);
        });
    });
    describe('controller methods', function() {
        it('should go back', function() {
           component.goBack();
           expect(catalogStateStub.selectedRecord).toBeUndefined();
        });
        describe('should update the record', function() {
            beforeEach(function() {
                catalogStateStub.selectedRecord = { '@id': 'old', '@type': [], [`${CATALOG}catalog`]: [{ '@id': catalogId }] };
                spyOn(component, 'setInfo');
            });
            it('if updateRecord resolves', fakeAsync(function() {
                component.completeRecord = [cloneDeep(record)];
                component.updateRecord(record);
                tick();
                expect(catalogManagerStub.updateRecord).toHaveBeenCalledWith(recordId, catalogId, [record]);
                expect(component.setInfo).toHaveBeenCalledWith([record]);
                expect(catalogStateStub.selectedRecord).toEqual(record);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless updateRecord rejects', fakeAsync(function() {
                component.completeRecord = [cloneDeep(record)];
                catalogManagerStub.updateRecord.and.returnValue(throwError('Error message'));
                component.updateRecord(record);
                tick();
                expect(catalogManagerStub.updateRecord).toHaveBeenCalledWith(recordId, catalogId, [record]);
                expect(component.setInfo).not.toHaveBeenCalled();
                expect(catalogStateStub.selectedRecord).toEqual({'@id': 'old', '@type': [], [`${CATALOG}catalog`]: [{ '@id': catalogId }]});
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
            }));
        });
        it('should update the description', function() {
            spyOn(component, 'updateRecord');
            component.record = cloneDeep(record);
            const description = 'This is a new description';
            component.updateDescription(`${description}     `);
            expect(component.record[`${DCTERMS}description`][0]['@value']).toEqual(description);
            expect(component.updateRecord).toHaveBeenCalledWith(component.record);
        });
        describe('should update the title', function() {
            beforeEach(function() {
                spyOn(component, 'updateRecord');
                component.record = cloneDeep(record);
                component.title = 'title';
            });
            it('when changed', function() {
                const title = 'This is a new title';
                component.updateTitle(title);
                expect(component.record[`${DCTERMS}title`][0]['@value']).toEqual(title);
                expect(component.updateRecord).toHaveBeenCalledWith(component.record);
            });
            it('and update ontology state title if open', function() {
                const listItem = new OntologyListItem();
                listItem.versionedRdfRecord.title = 'title';
                ontologyStateStub.list = [listItem];
                const title = 'This is a new title';
                component.updateTitle(title);
                expect(component.record[`${DCTERMS}title`][0]['@value']).toEqual(title);
                expect(component.updateRecord).toHaveBeenCalledWith(component.record);
                expect(listItem.versionedRdfRecord.title).toEqual(title);
            });
        });
        describe('should set whether the user can edit the record', function() {
            beforeEach(function() {
                component.record = record;
                component.canEdit = true;
            });
            describe('when evaluateRequest resolves', function() {
                it('with Permit', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                    component.setCanEdit();
                    tick();
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: `${POLICY}Update`});
                    expect(component.canEdit).toEqual(true);
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                }));
                it('with Indeterminate', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.indeterminate));
                    component.setCanEdit();
                    tick();
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: `${POLICY}Update`});
                    expect(component.canEdit).toEqual(true);
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                }));
                it('with Deny', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                    component.setCanEdit();
                    tick();
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: `${POLICY}Update`});
                    expect(component.canEdit).toEqual(false);
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                }));
            });
            it('when evaluateRequest rejects', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(throwError('Error message'));
                component.setCanEdit();
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: `${POLICY}Update`});
                expect(component.canEdit).toEqual(false);
                expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
        it('should set all record information', function() {
            component.setInfo([record]);
            expect(component.completeRecord).toEqual([record]);
            expect(component.record).toEqual(record);
            expect(component.title).toEqual('title');
            expect(component.description).toEqual('description');
            expect(component.modified).toEqual(SHORT_DATE_STR);
            expect(component.issued).toEqual(SHORT_DATE_STR);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.record-view')).length).toEqual(1);
            expect(element.queryAll(By.css('.record-view .back-column')).length).toEqual(1);
            expect(element.queryAll(By.css('.record-view .record-body')).length).toEqual(1);
            expect(element.queryAll(By.css('.record-view .record-sidebar')).length).toEqual(1);
        });
        ['record-view-tabset', 'button', 'record-icon', 'dl', 'entity-publisher', 'catalog-record-keywords', 'limit-description'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
    it('should go back to the catalog page when the button is clicked', function() {
        spyOn(component, 'goBack');
        const button = element.queryAll(By.css('button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.goBack).toHaveBeenCalledWith();
    });
});
