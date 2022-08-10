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
import { MatButtonModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
    mockOntologyState,
    mockPolicyEnforcement,
    mockUtil,
} from '../../../../../../test/ts/Shared';
import { InlineEditComponent } from '../../../shared/components/inlineEdit/inlineEdit.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { CatalogRecordKeywordsComponent } from '../catalogRecordKeywords/catalogRecordKeywords.component';
import { EntityPublisherComponent } from '../entityPublisher/entityPublisher.component';
import { LimitDescriptionComponent } from '../../../shared/components/limitDescription/limitDescription.component';
import { OpenRecordButtonComponent } from '../openRecordButton/openRecordButton.component';
import { RecordIconComponent } from '../recordIcon/recordIcon.component';
import { RecordViewTabsetComponent } from '../recordViewTabset/recordViewTabset.component';
import { CATALOG, DCTERMS, POLICY } from '../../../prefixes';
import { RecordViewComponent } from './recordView.component';
import { ManageRecordButtonComponent } from '../manageRecordButton/manageRecordButton.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

describe('Record View component', function() {
    let component: RecordViewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordViewComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let ontologyStateStub;
    let policyEnforcementStub;
    let utilStub;

    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const record: JSONLDObject = {'@id': recordId, '@type': []};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
                { provide: OntologyStateService, useClass: mockOntologyState },
                { provide: 'policyEnforcementService', useClass: mockPolicyEnforcement },
                { provide: 'utilService', useClass: mockUtil },
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RecordViewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.get(CatalogManagerService);
        catalogStateStub = TestBed.get(CatalogStateService);
        ontologyStateStub = TestBed.get(OntologyStateService);
        policyEnforcementStub = TestBed.get('policyEnforcementService');
        utilStub = TestBed.get('utilService');

        utilStub.getPropertyId.and.callFake((obj, propId) => {
            if (propId === CATALOG + 'catalog') {
                return catalogId;
            }
            return '';
        });
        utilStub.getDctermsValue.and.callFake((obj, prop) => prop);
        utilStub.getDate.and.returnValue('date');
        utilStub.updateDctermsValue.and.callFake((obj, prop, newVal) => obj[DCTERMS + prop] = [{'@value': newVal}]);
        catalogStateStub.selectedRecord = record;
        catalogManagerStub.getRecord.and.returnValue(of([record]));
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
        utilStub = null;
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
            expect(component.setInfo).toHaveBeenCalledWith([record]);
            expect(component.setCanEdit).toHaveBeenCalledWith();
            expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            expect(catalogStateStub.selectedRecord).toEqual(record);
        });
        it('unless the record is not found', function() {
            catalogManagerStub.getRecord.and.returnValue(throwError('Error message'));
            component.ngOnInit();
            expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
            expect(component.setInfo).not.toHaveBeenCalled();
            expect(component.setCanEdit).not.toHaveBeenCalled();
            expect(catalogStateStub.selectedRecord).toBeUndefined();
            expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
        });
    });
    describe('controller methods', function() {
        it('should go back', function() {
           component.goBack();
           expect(catalogStateStub.selectedRecord).toBeUndefined();
        });
        describe('should update the record', function() {
            beforeEach(function() {
                catalogStateStub.selectedRecord = {'@id': 'old', '@type': []};
                spyOn(component, 'setInfo');
            });
            it('if updateRecord resolves', fakeAsync(function() {
                component.completeRecord = [Object.assign({}, record)];
                component.updateRecord(record);
                tick();
                expect(catalogManagerStub.updateRecord).toHaveBeenCalledWith(recordId, catalogId, [record]);
                expect(component.setInfo).toHaveBeenCalledWith([record]);
                expect(catalogStateStub.selectedRecord).toEqual(record);
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless updateRecord rejects', fakeAsync(function() {
                component.completeRecord = [Object.assign({}, record)];
                catalogManagerStub.updateRecord.and.returnValue(throwError('Error message'));
                component.updateRecord(record);
                tick();
                expect(catalogManagerStub.updateRecord).toHaveBeenCalledWith(recordId, catalogId, [record]);
                expect(component.setInfo).not.toHaveBeenCalled();
                expect(catalogStateStub.selectedRecord).toEqual({'@id': 'old', '@type': []});
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
            }));
        });
        it('should update the description', function() {
            spyOn(component, 'updateRecord');
            component.record = record;
            const description = 'This is a new description';
            component.updateDescription(description + '     ');
            expect(component.record[DCTERMS + 'description'][0]['@value']).toEqual(description);
            expect(component.updateRecord).toHaveBeenCalledWith(record);
        });
        describe('should update the title', function() {
            beforeEach(function() {
                spyOn(component, 'updateRecord');
                component.record = record;
                component.title = 'title';
            });
            it('when changed', function() {
                const title = 'This is a new title';
                component.updateTitle(title);
                expect(component.record[DCTERMS + 'title'][0]['@value']).toEqual(title);
                expect(component.updateRecord).toHaveBeenCalledWith(record);
            });
            it('and update ontology state title if open', function() {
                ontologyStateStub.list = [{versionedRdfRecord: {title: 'title'}}];
                const title = 'This is a new title';
                component.updateTitle(title);
                expect(component.record[DCTERMS + 'title'][0]['@value']).toEqual(title);
                expect(component.updateRecord).toHaveBeenCalledWith(record);
                expect(ontologyStateStub.list[0].versionedRdfRecord.title).toEqual(title);
            });
        });
        describe('should set whether the user can edit the record', function() {
            beforeEach(function() {
                component.record = record;
                component.canEdit = true;
            });
            describe('when evaluateRequest resolves', function() {
                it('with Permit', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.permit);
                    component.setCanEdit();
                    tick();
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: POLICY + 'Update'});
                    expect(component.canEdit).toEqual(true);
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                }));
                it('with Indeterminate', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.indeterminate);
                    component.setCanEdit();
                    tick();
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: POLICY + 'Update'});
                    expect(component.canEdit).toEqual(true);
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                }));
                it('with Deny', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.deny);
                    component.setCanEdit();
                    tick();
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: POLICY + 'Update'});
                    expect(component.canEdit).toEqual(false);
                    expect(utilStub.createWarningToast).not.toHaveBeenCalled();
                }));
            });
            it('when evaluateRequest rejects', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.rejectWith('Error message');
                component.setCanEdit();
                tick();
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: POLICY + 'Update'});
                expect(component.canEdit).toEqual(false);
                expect(utilStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.record-view')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(1);
            expect(element.queryAll(By.css('.back-column')).length).toEqual(1);
            expect(element.queryAll(By.css('.record-body')).length).toEqual(1);
            expect(element.queryAll(By.css('.record-sidebar')).length).toEqual(1);
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
