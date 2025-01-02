/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError} from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { last } from 'lodash';

import { 
    cleanStylesFromDOM
 } from '../../../../../../public/test/ts/Shared';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { InstanceFormComponent } from '../instanceForm/instanceForm.component';
import { InstanceDetails } from '../../../models/instanceDetails.interface';
import { RDFS, DCTERMS } from '../../../../prefixes';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { InstanceCreatorComponent } from './instanceCreator.component';

describe('Instance Creator component', function() {
    let component: InstanceCreatorComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<InstanceCreatorComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let exploreUtilsServiceStub: jasmine.SpyObj<ExploreUtilsService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                InstanceCreatorComponent,
                MockComponent(InstanceFormComponent)
            ],
            providers: [
                MockProvider(ExploreService),
                MockProvider(ExploreUtilsService),
                MockProvider(ExploreUtilsService),
                MockProvider(DiscoverStateService),
                MockProvider(ToastService),
                MockProvider(PolicyEnforcementService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InstanceCreatorComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        exploreServiceStub = TestBed.inject(ExploreService) as jasmine.SpyObj<ExploreService>;
        exploreUtilsServiceStub = TestBed.inject(ExploreUtilsService) as jasmine.SpyObj<ExploreUtilsService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;

        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';
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
        exploreServiceStub = null;
        exploreUtilsServiceStub = null;
        toastStub = null;
        policyEnforcementStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.instance-creator')).length).toEqual(1);
        });
        it('with a header', function() {
            expect(element.queryAll(By.css('.instances-creator-header')).length).toBe(1);
        });
        it('with a breadcrumb', function() {
            expect(element.queryAll(By.css('breadcrumbs')).length).toBe(1);
        });
        it('with header buttons', function() {
            expect(element.queryAll(By.css('.instances-creator-header button')).length).toBe(2);
        });
        it('with a divider', function() {
            expect(element.queryAll(By.css('mat-divider')).length).toBe(1);
        });
        it('with a instance-form', function() {
            expect(element.queryAll(By.css('instance-form')).length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('save should call the correct functions when createInstance is', function() {
            beforeEach(function() {
                this.instance = {'@id': 'id'};
                this.instance[`${DCTERMS}title`] = [{'@value': 'title'}, {'@value': 'arabic', '@language': 'ar'}];
                this.instance[`${RDFS}label`] = [{'@value': 'label'}];
                this.instance[`${RDFS}comment`] = [{'@value': 'comment', '@language': 'en'}, {'@value': 'arabic', '@language': 'ar'}];
                this.cleanEntity = [{prop: 'new'}];
                discoverStateStub.explore.instance.entity = [this.instance];
                discoverStateStub.getInstance.and.returnValue(this.instance);
                exploreUtilsServiceStub.removeEmptyPropertiesFromArray.and.returnValue(this.cleanEntity);
                discoverStateStub.explore.instanceDetails.currentPage = 1;
                discoverStateStub.explore.instanceDetails.limit = 1;
                discoverStateStub.explore.instanceDetails.total = 3;
            });
            describe('resolved and getClassInstanceDetails is', function() {
                beforeEach(function() {
                    exploreServiceStub.createInstance.and.returnValue(of(''));
                });
                describe('resolved and getClassDetails is', function() {
                    beforeEach(function () {
                        this.resultsObject = {data: [{ instanceIRI: 'id2' }], links: {next: 'next', prev: 'prev'}};
                        discoverStateStub.explore.breadcrumbs = ['old title'];
                        exploreServiceStub.getClassInstanceDetails.and.returnValue(of(new HttpResponse<InstanceDetails[]>({body: []})));
                        exploreServiceStub.createPagedResultsObject.and.returnValue(this.resultsObject);
                    });
                    it('resolved', fakeAsync(function() {
                        exploreServiceStub.getClassDetails.and.returnValue(of([]));
                        component.save();
                        fixture.detectChanges();
                        tick();
                        expect(discoverStateStub.getInstance).toHaveBeenCalledWith();
                        expect(exploreUtilsServiceStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                        expect(discoverStateStub.explore.instance.entity).toEqual(this.cleanEntity);
                        expect(exploreServiceStub.createInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.instance.entity);
                        expect(discoverStateStub.explore.instanceDetails.total).toBe(4);
                        expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {offset: 1, limit: 1});
                        expect(discoverStateStub.explore.instanceDetails.data).toEqual(this.resultsObject.data);
                        expect(discoverStateStub.explore.instance.metadata).toEqual({instanceIRI: this.instance['@id'], title: 'title', description: 'comment'});
                        expect(last(discoverStateStub.explore.breadcrumbs)).toBe('title');
                        expect(discoverStateStub.explore.creating).toEqual(false);
                        expect(exploreServiceStub.getClassDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId);
                        expect(discoverStateStub.explore.classDetails).toEqual([]);
                    }));
                    it('rejected', fakeAsync(function() {
                        exploreServiceStub.getClassDetails.and.returnValue(throwError('error'));
                        component.save();
                        fixture.detectChanges();
                        tick();
                        expect(discoverStateStub.getInstance).toHaveBeenCalledWith();
                        exploreServiceStub.createInstance(discoverStateStub.explore.recordId, discoverStateStub.explore.instance.entity).subscribe(() => {
                            expect(exploreUtilsServiceStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                            expect(discoverStateStub.explore.instance.entity).toEqual(this.cleanEntity);
                            expect(exploreServiceStub.createInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.instance.entity);
                            expect(discoverStateStub.explore.instanceDetails.total).toBe(4);
                            expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {offset: 1, limit: 1});
                            expect(discoverStateStub.explore.instanceDetails.data).toEqual(this.resultsObject.data);
                            expect(discoverStateStub.explore.instance.metadata).toEqual({instanceIRI: this.instance['@id'], title: 'title', description: 'comment'});
                            expect(last(discoverStateStub.explore.breadcrumbs)).toBe('title');
                            expect(discoverStateStub.explore.creating).toEqual(false);
                            expect(exploreServiceStub.getClassDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId);
                            expect(discoverStateStub.explore.classDetails).toEqual([]);
                            expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
                        });
                    }));
                });
                it('rejected', fakeAsync(function() {
                    exploreServiceStub.getClassInstanceDetails.and.returnValue(throwError('error'));
                    component.save();
                    fixture.detectChanges();
                    tick();
                    exploreServiceStub.createInstance(discoverStateStub.explore.recordId, discoverStateStub.explore.instance.entity).subscribe(() => {
                        expect(discoverStateStub.getInstance).toHaveBeenCalledWith();
                        expect(exploreUtilsServiceStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                        expect(discoverStateStub.explore.instance.entity).toEqual(this.cleanEntity);
                        expect(exploreServiceStub.createInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.instance.entity);
                        expect(discoverStateStub.explore.instanceDetails.total).toBe(4);
                        expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {offset: 1, limit: 1});
                        expect(exploreServiceStub.getClassDetails).not.toHaveBeenCalled();
                        expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
                    });
                }));
            });
            it('rejected', fakeAsync(function() {
                exploreServiceStub.createInstance.and.returnValue(throwError('error'));
                component.save();
                fixture.detectChanges();
                tick();
                expect(discoverStateStub.getInstance).toHaveBeenCalledWith();
                expect(exploreUtilsServiceStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                expect(discoverStateStub.explore.instance.entity).toEqual(this.cleanEntity);
                expect(exploreServiceStub.createInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.instance.entity);
                expect(discoverStateStub.explore.instanceDetails.total).toBe(3);
                expect(exploreServiceStub.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(exploreServiceStub.getClassDetails).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
            }));
        });
        it('cancel sets the correct variables', function() {
            discoverStateStub.explore.instance.entity = [{'@id': 'entity', '@type': ['test type']}];
            discoverStateStub.explore.breadcrumbs = ['classId', 'new'];
            component.cancel();
            expect(discoverStateStub.explore.instance.entity).toEqual([]);
            expect(discoverStateStub.explore.creating).toBe(false);
            expect(discoverStateStub.explore.breadcrumbs).toEqual(['classId']);
        });
    });
});
