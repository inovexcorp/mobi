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
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockDirective, MockProvider } from 'ng-mocks';

import { 
    cleanStylesFromDOM, mockPolicyEnforcement, mockUtil
 } from '../../../../../../../test/ts/Shared';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ExploreService } from '../../../services/explore.service';
import { InstanceFormComponent } from '../instanceForm/instanceForm.component';
import { ClassCardsComponent } from './classCards.component';
import { of, throwError} from 'rxjs';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { InstanceDetails } from '../../../models/instanceDetails.interface';


describe('Class Cards component', function() {
    let component: ClassCardsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassCardsComponent>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let policyEnforcementStub;
    let utilStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ClassCardsComponent,
                MockComponent(InstanceFormComponent)
            ],
            providers: [
                MockProvider(DiscoverStateService),
                MockProvider(ExploreService),
                { provide: 'policyEnforcementService', useClass: mockPolicyEnforcement },
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassCardsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        exploreServiceStub = TestBed.get(ExploreService);
        discoverStateStub = TestBed.get(DiscoverStateService);
        policyEnforcementStub = TestBed.get('policyEnforcementService');
        utilStub = TestBed.get('utilService');

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

        component.classDetails = [{
            classIRI: 'www.test1.com',
            classDescription: 'test 1 desc',
            instancesCount: 1,
            classTitle: 'a',
            ontologyRecordTitle: 'testOntology',
            deprecated: false,
            classExamples: ['test1', 'test2'],
        }, {
            classIRI: 'www.test2.com',
            classDescription: 'test 2 desc',
            instancesCount: 2,
            classTitle: 'b',
            ontologyRecordTitle: 'testOntology',
            deprecated: false,
            classExamples: ['test3', 'test4'],
        }, {
            classIRI: 'www.test3.com',
            classDescription: 'test 3 desc',
            instancesCount: 2,
            classTitle: 'c',
            ontologyRecordTitle: 'testOntology',
            deprecated: false,
            classExamples: ['test5', 'test6'],
        }];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        exploreServiceStub = null;
        discoverStateStub = null;
        utilStub = null;
    });

    describe('initializes with the correct values', function() {
        it('for chunks', function() {
            let expected = [[
                {
                    classIRI: 'www.test2.com',
                    classDescription: 'test 2 desc',
                    instancesCount: 2,
                    classTitle: 'b',
                    ontologyRecordTitle: 'testOntology',
                    deprecated: false,
                    classExamples: ['test3', 'test4'],
                },
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
                    classIRI: 'www.test1.com',
                    classDescription: 'test 1 desc',
                    instancesCount: 1,
                    classTitle: 'a',
                    ontologyRecordTitle: 'testOntology',
                    deprecated: false,
                    classExamples: ['test1', 'test2'],
                }
            ]];
            component.ngOnChanges();
            fixture.detectChanges();
            expect(component.chunks).toEqual(expected);
        });
    });
    describe('controller bound variable', function() {
        it('classDetails should be one way bound', function() {
            component.classDetails = [];
            fixture.detectChanges(); // scope.$digest();
            expect(component.classDetails).toEqual([]);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.class-cards')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('exploreData should set the correct variables', function() {
            it('when user has read access and getClassInstances is resolved', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.permit);
                const classIRI = 'www.test.com';
                discoverStateStub.explore.recordId = 'www.record.com';
                const data : InstanceDetails[] = [{instanceIRI: 'www.newClass.com', title: 'newClass', description: 'new class desc'}];
                let nextLink = 'http://example.com/next';
                let prevLink = 'http://example.com/prev';
                const headers = {'x-total-count': '' + 10, link: 'link'};
                utilStub.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
                discoverStateStub.explore.breadcrumbs = [''];
                discoverStateStub.explore.instanceDetails.data = [{instanceIRI: 'www.oldClass.com', title: 'oldClass', description: 'old class desc'}];
                exploreServiceStub.getClassInstanceDetails.and.returnValue(of(new HttpResponse<InstanceDetails[]>({body: data, headers: new HttpHeaders(headers)})));
                exploreServiceStub.createPagedResultsObject.and.returnValue({data: [{instanceIRI: 'instance', title: 'test', description: 'desc'}], total: 1});
                component.exploreData({
                    classIRI: classIRI,
                    classTitle: 'test',
                    classDescription: 'description',
                    instancesCount: 0,
                    classExamples: ['example'],
                    ontologyRecordTitle: 'testOntology',
                    deprecated: false});
                fixture.detectChanges();
                tick(100);
                exploreServiceStub.getClassInstanceDetails(discoverStateStub.explore.recordId, classIRI,
                    {pageIndex: 0, limit: discoverStateStub.explore.instanceDetails.limit}).subscribe(result => {

                    expect(discoverStateStub.explore.classId).toBe('www.test.com');
                    expect(discoverStateStub.explore.classDeprecated).toBe(false);
                    expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith('www.record.com', 'www.test.com', {
                        pageIndex: 0,
                        limit: discoverStateStub.explore.instanceDetails.limit
                    });

                    expect(discoverStateStub.resetPagedInstanceDetails).toHaveBeenCalled();
                    expect(discoverStateStub.explore.breadcrumbs).toEqual(['', 'test']);
                    expect(discoverStateStub.explore.instanceDetails).toEqual(jasmine.objectContaining({
                        data: [{instanceIRI: 'instance', title: 'test', description: 'desc'}]
                    }));
                })
            }));
            it('when user has read access and getClassInstances is rejected', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.permit);
                exploreServiceStub.getClassInstanceDetails.and.returnValue(throwError('error'));
                let classDetails = {
                    classIRI: 'class',
                    classTitle: 'new class',
                    classDescription: 'desc',
                    instancesCount: 1,
                    classExamples: ['www.class1.com'],
                    ontologyRecordTitle: 'test ontology',
                    deprecated: false
                }
                component.exploreData(classDetails);
                fixture.detectChanges();
                tick(100);
                expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, 'class', {pageIndex: 0, limit: discoverStateStub.explore.instanceDetails.limit});
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('error');
            }));
            it('when user does not have read access', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.deny);
                exploreServiceStub.getClassInstanceDetails.and.returnValue(throwError('error'));
                let classDetails = {
                    classIRI: 'class',
                    classTitle: 'new class',
                    classDescription: 'desc',
                    instancesCount: 1,
                    classExamples: ['www.class1.com'],
                    ontologyRecordTitle: 'test ontology',
                    deprecated: false
                }
                component.exploreData(classDetails);
                fixture.detectChanges();
                tick(100);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('You don\'t have permission to read dataset');
                expect(discoverStateStub.resetPagedInstanceDetails).toHaveBeenCalled();
                expect(discoverStateStub.explore.classDetails).toEqual([]);
                expect(discoverStateStub.explore.hasPermissionError).toEqual(true);
            }));
        });
    });
});
