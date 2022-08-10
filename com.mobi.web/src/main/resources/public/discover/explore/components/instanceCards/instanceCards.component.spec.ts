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
import { MatDialog } from '@angular/material';
import { By } from '@angular/platform-browser';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpHeaders, HttpResponse } from '@angular/common/http';

import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { 
    cleanStylesFromDOM, mockPolicyEnforcement, mockUtil
 } from '../../../../../../../test/ts/Shared';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { InstanceFormComponent } from '../instanceForm/instanceForm.component';
import { InstanceCardsComponent } from './instanceCards.component';
import { InstanceDetails } from '../../../models/instanceDetails.interface';
import { JSONLDObject } from '../../../../shared/models/JSONLDObject.interface';
import { ConfirmModalComponent } from '../../../../shared/components/confirmModal/confirmModal.component';

describe('Instance Cards component', function() {
    let component: InstanceCardsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<InstanceCardsComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let exploreUtilsServiceStub: jasmine.SpyObj<ExploreUtilsService>;
    let policyEnforcementStub: jasmine.SpyObj<any>;
    let utilServiceStub: jasmine.SpyObj<any>;
    let dialogStub : jasmine.SpyObj<MatDialog>
    const data = [
        {
            description: 'Test data 1',
            instanceIRI: 'http://www.mombi.com/ontologies/2022/test.owl#MyInstace1',
            title: 'My Instance 1'
        }, {
            description: 'Test data 2',
            instanceIRI: 'http://www.mombi.com/ontologies/2022/test.owl#MyInstace2',
            title: 'My Instance 2'
        }, {
            description: 'Test data 3',
            instanceIRI: 'http://www.mombi.com/ontologies/2022/test.owl#MyInstace3',
            title: 'My Instance 3'
        }
    ];
    let record = {
        description: 'Test data 1',
        instanceIRI: 'http://www.mombi.com/ontologies/2022/test.owl#MyInstace1',
        title: 'My Instance 1'
    };
    const responseBody: JSONLDObject[] = [{
        '@id': 'http://www.mombi.com/ontologies/2022/test.owl#MyInstace1',
        '@type': [
            'http://www.mombi.com/ontologies/2022/test.owl#MyInstace1',
            'http://www.w3.org/2002/07/owl#NamedIndividual'
        ]
    }];
    const headers = {'x-total-count': '' + 10, link: 'link'};
    const totalCards = data.length;
    const resultsObject = {
        data: [ {
            description: 'Test data 1',
            instanceIRI: 'http://www.mombi.com/ontologies/2022/test.owl#MyInstace1',
            title: 'My Instance 1'
        }],
        links: { prev: 'prev', next: 'next' },
        total: totalCards
    };


    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                InstanceCardsComponent,
                MockComponent(InstanceFormComponent)
            ],
            providers: [
                MockProvider(DiscoverStateService),
                MockProvider(ExploreService),
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'policyEnforcementService', useClass: mockPolicyEnforcement },
            ]
        });
    });

   beforeEach(function() {
        fixture = TestBed.createComponent(InstanceCardsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.get(DiscoverStateService);
        exploreServiceStub = TestBed.get(ExploreService);
        exploreUtilsServiceStub = TestBed.get(ExploreUtilsService);
        policyEnforcementStub = TestBed.get('policyEnforcementService');
        utilServiceStub = TestBed.get('utilService');
        dialogStub = TestBed.get(MatDialog);

        component.instanceData  = data;
        discoverStateStub.explore = {
            breadcrumbs: ['Classes'],
            classDeprecated: false,
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                entity: [],
                metadata: undefined,
                objectMap: {},
                original: []
            },
            instanceDetails: {
                currentPage: 0,
                data: [],
                limit: 99,
                total: 0,
                links: {
                    next: '',
                    prev: ''
                },
            },
            recordId: '',
            recordTitle: '',
            hasPermissionError: false
        };

       discoverStateStub.explore.recordId = 'recordId1';

       let chunks = [[
           {
               classIRI: 'www.test3.com',
               classDescription: 'test 3 desc',
               instancesCount: 2,
               classTitle: 'c',
               ontologyRecordTitle: 'testOntology',
               deprecated: false,
               classExamples: ['test5', 'test6'],
           },
           {
               classIRI: 'www.test2.com',
               classDescription: 'test 4 desc',
               instancesCount: 2,
               classTitle: 'b',
               ontologyRecordTitle: 'testOntology',
               deprecated: false,
               classExamples: ['test3', 'test4'],
           },
           {
               classIRI: 'www.test1.com',
               classDescription: 'test 1 desc',
               instancesCount: 1,
               classTitle: 'a',
               ontologyRecordTitle: 'testOntology',
               deprecated: false,
               classExamples: ['test1', 'test2'],
           }
       ]];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
        exploreServiceStub = null;
        exploreUtilsServiceStub = null;
        policyEnforcementStub = null;
        utilServiceStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', async () =>  {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.instance-cards')).length).toEqual(1);
            expect(element.queryAll(By.css('.card-container')).length).toBe(totalCards);
            expect(element.queryAll(By.css('mat-card')).length).toBe(totalCards);

        });
    });
    it('properly defines controller.chunks on load', async function() {
        component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.chunks.length).toEqual(1);
        expect(component.chunks[0].length).toEqual(totalCards);
        expect(component.chunks[0]).toEqual(data);
    });
    describe('controller methods', function() {
        describe('view should set the correct variables', function() {
            describe('when getInstance is resolved and getReferencedTitles is', function() {
                beforeEach(function() {

                     const response = {
                         body: data,
                         header: new HttpHeaders({'x-total-count':''})
                     };

                    discoverStateStub.explore.breadcrumbs = ['', ''];
                    exploreServiceStub.getInstance.and.returnValue(of(responseBody));
                });
                it('resolved', async () => {
                    await policyEnforcementStub.evaluateRequest.and.returnValue(Promise.resolve(policyEnforcementStub.permit));
                    component.view(record);
                    fixture.detectChanges();
                    await fixture.whenStable();
                    expect(exploreServiceStub.getInstance).toHaveBeenCalledWith('recordId1', data[0].instanceIRI);
                    expect(discoverStateStub.explore.instance.entity).toEqual(responseBody);
                    expect(discoverStateStub.explore.instance.metadata).toEqual(data[0]);
                    expect(discoverStateStub.explore.hasPermissionError).toEqual(false);
                    expect(discoverStateStub.explore.breadcrumbs).toEqual(['', '', data[0].title]);
                });
                it('rejected', async () => {
                    await policyEnforcementStub.evaluateRequest.and.returnValue(Promise.resolve(policyEnforcementStub.deny));
                    component.view(record);
                    fixture.detectChanges();
                    await fixture.whenStable();
                    expect(exploreServiceStub.getInstance).not.toHaveBeenCalled();
                    expect(utilServiceStub.createErrorToast).toHaveBeenCalledWith(`You don't have permission to read dataset`);
                    expect(discoverStateStub.resetPagedInstanceDetails).toHaveBeenCalled();
                    expect(discoverStateStub.explore.breadcrumbs).toEqual(['']);
                    expect(discoverStateStub.explore.hasPermissionError).toEqual(true);
                });
            });
            it('rejected', async function() {
                await policyEnforcementStub.evaluateRequest.and.returnValue(Promise.reject('Error message'));
                component.view(record);
                fixture.detectChanges();
                await fixture.whenStable();
                expect(utilServiceStub.createWarningToast).toHaveBeenCalledWith('Could not retrieve record permissions');
            });
            it('and user does not have read permission', async () => {
                policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.deny);
                component.view(record);
                fixture.detectChanges();
                await fixture.whenStable();
                expect(discoverStateStub.explore.hasPermissionError).toEqual(true);
                expect(utilServiceStub.createErrorToast).toHaveBeenCalled();
            });

        });
        describe('delete should call the correct methods when deleteInstance is', function() {
            describe('resolved and', function() {
                beforeEach(function() {
                    exploreServiceStub.deleteInstance.and.returnValue(of(null));
                    discoverStateStub.explore.instanceDetails.limit = 1;
                });
                describe('there are no more instances and getClassDetails is', function() {
                    beforeEach(function() {
                        discoverStateStub.explore.instanceDetails.total = 1;
                    });
                    it('resolved', function() {
                        exploreServiceStub.getClassDetails.and.returnValue(of([]));
                        component.delete(data[0]);
                        fixture.detectChanges();
                        expect(exploreServiceStub.deleteInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, data[0].instanceIRI);
                        expect(utilServiceStub.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                        expect(exploreServiceStub.getClassDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId);
                        expect(exploreServiceStub.getClassInstanceDetails).not.toHaveBeenCalled();
                        expect(discoverStateStub.explore.classDetails).toEqual([]);
                        expect(discoverStateStub.clickCrumb).toHaveBeenCalledWith(0);
                        expect(utilServiceStub.createErrorToast).not.toHaveBeenCalled();
                    });
                    it('rejected', function() {
                        exploreServiceStub.getClassDetails.and.returnValue(throwError('error'));
                        component.delete(data[0]);
                        fixture.detectChanges();
                        expect(exploreServiceStub.deleteInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, data[0].instanceIRI);
                        expect(utilServiceStub.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                        expect(exploreServiceStub.getClassDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId);
                        expect(exploreServiceStub.getClassInstanceDetails).not.toHaveBeenCalled();
                        expect(discoverStateStub.clickCrumb).not.toHaveBeenCalled();
                        expect(utilServiceStub.createErrorToast).toHaveBeenCalled();
                    });
                });
                describe('there are more instances and getClassInstanceDetails is', function() {
                    beforeEach(function() {
                        discoverStateStub.explore.instanceDetails.total = 5;
                        discoverStateStub.explore.instanceDetails.currentPage = 2;
                    });
                    describe('resolved and the instance', function() {
                        beforeEach(function() {
                            exploreServiceStub.getClassInstanceDetails.and
                                .returnValue(of(new HttpResponse<InstanceDetails[]>({body: data, headers: new HttpHeaders(headers)})));
                            exploreServiceStub.createPagedResultsObject.and.returnValue(resultsObject);
                        });
                        it('was the only one on the page', function() {
                            discoverStateStub.explore.instanceDetails.data = [data[0]];
                            component.delete(data[0]);
                            fixture.detectChanges();
                            expect(exploreServiceStub.deleteInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, data[0].instanceIRI);
                            expect(utilServiceStub.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                            expect(exploreServiceStub.getClassDetails).not.toHaveBeenCalled();
                            expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {pageIndex: 1, limit: 1});
                            expect(exploreServiceStub.createPagedResultsObject).toHaveBeenCalled();
                            expect(discoverStateStub.explore.instanceDetails.data).toEqual(resultsObject.data);
                            expect(discoverStateStub.explore.instanceDetails.total).toBe(4);
                            expect(discoverStateStub.explore.instanceDetails.currentPage).toBe(1);
                            expect(utilServiceStub.createErrorToast).not.toHaveBeenCalled();
                        });
                        it('was not the only one on the page', function() {
                            component.delete(data[1]);
                            fixture.detectChanges();
                            expect(exploreServiceStub.deleteInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, data[1].instanceIRI);
                            expect(utilServiceStub.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                            expect(exploreServiceStub.getClassDetails).not.toHaveBeenCalled();
                            expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {pageIndex: 2, limit: 1});
                            expect(exploreServiceStub.createPagedResultsObject).toHaveBeenCalled();
                            expect(discoverStateStub.explore.instanceDetails.data).toEqual(resultsObject.data);
                            expect(discoverStateStub.explore.instanceDetails.total).toBe(4);
                            expect(discoverStateStub.explore.instanceDetails.currentPage).toBe(2);
                            expect(utilServiceStub.createErrorToast).not.toHaveBeenCalled();
                        });
                    });
                    it('rejected', function() {
                        exploreServiceStub.getClassInstanceDetails.and
                            .returnValue(throwError('error'));
                        component.delete(data[0]);
                        fixture.detectChanges();
                        expect(exploreServiceStub.deleteInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, data[0].instanceIRI);
                        expect(utilServiceStub.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                        expect(exploreServiceStub.getClassDetails).not.toHaveBeenCalled();
                        expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {pageIndex: 2, limit: 1});
                        expect(utilServiceStub.createErrorToast).toHaveBeenCalledWith('error');
                    });
                });
            });
            it('rejected', function() {
                exploreServiceStub.deleteInstance.and
                    .returnValue(throwError('error'));
                component.delete(data[1]);
                fixture.detectChanges();
                expect(exploreServiceStub.deleteInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, data[1].instanceIRI);
                expect(exploreServiceStub.getClassDetails).not.toHaveBeenCalled();
                expect(exploreServiceStub.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(utilServiceStub.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('confirmDelete should call the correct methods', function() {
            dialogStub.open.and.returnValue({
                afterClosed: () => {
                    return of(true);
                }
            } as MatDialogRef<typeof dialogStub>);
            spyOn(component,'delete');
            component.confirmDelete(data[0]);
            fixture.detectChanges();
            expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                data: {
                    content: 'Are you sure you want to delete <strong>' + data[0].title + '</strong>?'
                }
            });
            expect(component.delete).toHaveBeenCalled();
        });
    });
});
