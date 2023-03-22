/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { last } from 'lodash';

import { 
    cleanStylesFromDOM
 } from '../../../../../test/ts/Shared';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { InstanceCardsComponent } from '../instanceCards/instanceCards.component';
import { SplitIRIPipe } from '../../../../shared/pipes/splitIRI.pipe';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { InstancesDisplayComponent } from './instancesDisplay.component';
import { UtilService } from '../../../../shared/services/util.service';

describe('Instances Display component', function() {
    let component: InstancesDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<InstancesDisplayComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let splitIriStub: jasmine.SpyObj<SplitIRIPipe>;
    const page: PageEvent = new PageEvent();
    const totalSize = 10;
    const headers = {'x-total-count': '' + totalSize};
    const response = {
        body: ['data'],
        headers: new HttpHeaders(headers)
    };
    const responseObj = {
        data: response.body,
        total: totalSize
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                InstancesDisplayComponent,
                MockComponent(InstanceCardsComponent)
            ],
            providers: [
                MockProvider(ExploreService),
                MockProvider(DiscoverStateService),
                MockProvider(UtilService),
                MockProvider(PolicyEnforcementService),
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
                MockProvider(SplitIRIPipe),
                MockProvider(UtilService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InstancesDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        exploreServiceStub = TestBed.inject(ExploreService) as jasmine.SpyObj<ExploreService>;
        splitIriStub = TestBed.inject(SplitIRIPipe) as jasmine.SpyObj<SplitIRIPipe>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));

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
    });
    
    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
        policyEnforcementStub = null;
        exploreServiceStub = null;
        utilStub = null;
        splitIriStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers',  () => {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.instances-display-header ')).length).toEqual(1);
            expect(element.queryAll(By.css('.instances-display')).length).toEqual(1);
        });
        ['breadcrumbs', 'button.create-button', '.instance-cards-container','instance-cards','mat-paginator'].forEach(test => {
            it('with a ' + test,   () => {
                fixture.detectChanges();
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(() => {
            splitIriStub.transform.and.returnValue({
                begin: 'begin',
                then: 'then',
                end: 'end'
            });
        });
        describe('setPage should call the correct methods and set variables', function() {
            beforeEach(function() {
                page.pageIndex = totalSize;
                const tempData = {
                    body: [
                        {
                            instanceIRI: 'propertyId',
                            title: 'title',
                            description: 'description'
                        },
                        {
                            instanceIRI: 'propertyId2',
                            title: 'title',
                            description: 'description'
                        },
                        {
                            instanceIRI: 'propertyId3',
                            title: 'title',
                            description: 'description'
                        }
                    ],
                    headers: new HttpHeaders({'x-total-count': ''})
                };
                exploreServiceStub.getClassInstanceDetails.and.returnValue(of(new HttpResponse(tempData)));
                exploreServiceStub.createPagedResultsObject.and.returnValue(responseObj);
            });
            it('when user has read permission to dataset record', async () => {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                component.ngOnInit();
                component.setPage(page);
                fixture.detectChanges();
                await fixture.whenStable();
                expect(discoverStateStub.explore.instanceDetails.currentPage).toEqual(10);
                expect(discoverStateStub.explore.hasPermissionError).toEqual(false);
                expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {
                    limit: discoverStateStub.explore.instanceDetails.limit,
                    offset: (page.pageIndex) * discoverStateStub.explore.instanceDetails.limit
                });
               expect(discoverStateStub.explore.instanceDetails.currentPage).toEqual(page.pageIndex);
               expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            });
            it('when user has read permission to dataset record and getClassInstanceDetails has error', async () => {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                exploreServiceStub.getClassInstanceDetails.and.returnValue(throwError('Error'));
                component.ngOnInit();
                component.setPage(page);
                fixture.detectChanges();
                await fixture.whenStable();
                expect(discoverStateStub.explore.instanceDetails.currentPage).toEqual(page.pageIndex);
                expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId,
                    discoverStateStub.explore.classId, {
                        limit: discoverStateStub.explore.instanceDetails.limit,
                        offset: (page.pageIndex) * discoverStateStub.explore.instanceDetails.limit
                    }
                );
                expect(exploreServiceStub.createPagedResultsObject).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
            });
            it('when user does not have read permission to dataset record', async () =>  {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                component.ngOnInit();
                component.setPage(page);
                fixture.detectChanges();
                await fixture.whenStable();
                expect(exploreServiceStub.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(exploreServiceStub.createPagedResultsObject).not.toHaveBeenCalled();
                expect(discoverStateStub.explore.hasPermissionError).toEqual(true);
                expect(discoverStateStub.explore.instanceDetails.data).toEqual([]);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('You don\'t have permission to read dataset');
            });
        });
        it('create method should set the correct variables when user has have modify permission', async function() {
            policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
            discoverStateStub.explore.creating = false;
            discoverStateStub.explore.instanceDetails.data = [{instanceIRI: 'instanceIRI', title: 'title', description: 'description'}];
            discoverStateStub.explore.classId = 'classId';
            component.create();
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(discoverStateStub.explore.creating).toBe(true);
            expect(splitIriStub.transform).toHaveBeenCalled();
            expect(discoverStateStub.explore.instance.entity[0]['@id']).toContain('begin');
            expect(discoverStateStub.explore.instance.entity[0]['@type']).toEqual(['classId']);
            expect(last(discoverStateStub.explore.breadcrumbs)).toBe('New Instance');
            expect(discoverStateStub.explore.instance.metadata.instanceIRI).toContain('beginthen');
        });
        it('create method when user does not have modify permission', async () => {
            policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
            discoverStateStub.explore.creating = false;
            discoverStateStub.explore.instanceDetails.data = [{instanceIRI: 'instanceIRI', title: 'title', description: 'description'}];
            discoverStateStub.explore.classId = 'classId';
            component.create();
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(discoverStateStub.explore.creating).toBe(false);
            expect(splitIriStub.transform).not.toHaveBeenCalledWith('instanceIRI');
            expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            expect(discoverStateStub.explore.instance.metadata).toBeUndefined();
        });
        it('button should say [Deprecated] if the class is deprecated', function() {
            const btn = element.nativeElement.querySelectorAll('button')[0];
            expect(btn.textContent.trim()).not.toContain('[Deprecated]');
            discoverStateStub.explore.classDeprecated = true;
            fixture.detectChanges();
            expect(btn.textContent.trim()).toContain('[Deprecated]');
        });
    });
});
