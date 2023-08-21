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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { throwError, of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { last } from 'lodash';

import { 
    cleanStylesFromDOM
 } from '../../../../../../public/test/ts/Shared';
import { BreadcrumbsComponent } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { InstanceFormComponent } from '../instanceForm/instanceForm.component';
import { InstanceDetails } from '../../../models/instanceDetails.interface';
import { ToastService } from '../../../../shared/services/toast.service';
import { InstanceEditorComponent } from './instanceEditor.component';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';

describe('Instance Editor component', function() {
    let component: InstanceEditorComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<InstanceEditorComponent>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let exploreUtilsStub: jasmine.SpyObj<ExploreUtilsService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ ],
            declarations: [
                InstanceEditorComponent,
                MockComponent(InstanceFormComponent),
                BreadcrumbsComponent,
                MatDivider
            ],
            providers: [
                MockProvider(ExploreService),
                MockProvider(DiscoverStateService),
                MockProvider(ToastService),
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
                MockProvider(PolicyEnforcementService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InstanceEditorComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        exploreServiceStub = TestBed.inject(ExploreService) as jasmine.SpyObj<ExploreService>;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        exploreUtilsStub = TestBed.inject(ExploreUtilsService) as jasmine.SpyObj<ExploreUtilsService>;
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
                metadata: {instanceIRI: 'instanceIRI',
                    title: 'title',
                    description: 'description'
                },
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
        toastStub = null;
        exploreUtilsStub = null;
        policyEnforcementStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.instance-editor')).length).toEqual(1);
        });
        it('for a instances-editor-header', function() {
            expect(element.queryAll(By.css('.instances-editor-header')).length).toBe(1);
        });
        it('for a breadcrumb', function() {
            expect(element.queryAll(By.css('breadcrumbs')).length).toBe(1);
        });
        it('for header buttons', function() {
            expect(element.queryAll(By.css('.instances-editor-header button')).length).toBe(2);
        });
        it('for a divider', function() {
            expect(element.queryAll(By.css('mat-divider')).length).toBe(1);
        });
        it('for a instance-form', function() {
            expect(element.queryAll(By.css('instance-form')).length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('save should call the correct functions when updateInstance is', function() {
            beforeEach(function() {
                this.instance = {'@id': 'test', title: 'test title', description: 'test description'};
                discoverStateStub.explore.instance.entity = [this.instance];
                discoverStateStub.getInstance.and.returnValue(this.instance);
                exploreUtilsStub.removeEmptyPropertiesFromArray.and.returnValue([{'@id': 'test', '@type': ['test type']}]);
            });
            describe('resolved and getClassInstanceDetails is', function() {
                beforeEach(function() {
                    this.instanceIRI = discoverStateStub.explore.instance.metadata.instanceIRI;
                    exploreServiceStub.updateInstance.and.returnValue(of(null));
                });
                it('resolved', fakeAsync(function() {
                    const data = [{
                        instanceIRI: 'test',
                        title: 'test title',
                        description: 'test description'
                    }, {
                        instanceIRI: 'id2',
                        title: 'title2',
                        description: 'desc2'
                    }];
                    discoverStateStub.explore.breadcrumbs = ['old title'];
                    exploreServiceStub.getClassInstanceDetails.and.returnValue(of(new HttpResponse<InstanceDetails[]>({body: data})));
                    component.save();
                    fixture.detectChanges();
                    tick();
                    expect(discoverStateStub.getInstance).toHaveBeenCalledWith();
                    exploreServiceStub.updateInstance(discoverStateStub.explore.recordId,
                        discoverStateStub.explore.instance.metadata.instanceIRI,
                        discoverStateStub.explore.instance.entity).subscribe(() => {
                            expect(exploreUtilsStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                            expect(discoverStateStub.explore.instance.entity).toEqual([{'@id': 'test', '@type': ['test type']}]);
                            expect(exploreServiceStub.updateInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, this.instanceIRI, discoverStateStub.explore.instance.entity);
                            expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {offset: discoverStateStub.explore.instanceDetails.currentPage * discoverStateStub.explore.instanceDetails.limit, limit: discoverStateStub.explore.instanceDetails.limit});
                            expect(discoverStateStub.explore.instanceDetails.data).toEqual(data);
                            expect(discoverStateStub.explore.instance.metadata).toEqual({instanceIRI: 'test', title: 'test title', description: 'test description'});
                            expect(last(discoverStateStub.explore.breadcrumbs)).toBe('test title');
                            expect(discoverStateStub.explore.editing).toEqual(false);
                        });
                }));
                it('rejected', fakeAsync(function()  {
                    exploreServiceStub.getClassInstanceDetails.and.returnValue(throwError('error'));
                    component.save();
                    fixture.detectChanges();
                    tick();
                    expect(discoverStateStub.getInstance).toHaveBeenCalledWith();
                    expect(exploreUtilsStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                    expect(discoverStateStub.explore.instance.entity).toEqual([{'@id': 'test', '@type': ['test type']}]);
                    expect(exploreServiceStub.updateInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, this.instanceIRI, discoverStateStub.explore.instance.entity);
                    expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {offset: discoverStateStub.explore.instanceDetails.currentPage * discoverStateStub.explore.instanceDetails.limit, limit: discoverStateStub.explore.instanceDetails.limit});
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
                }));
            });
            it('rejected', fakeAsync(function() {
                exploreServiceStub.updateInstance.and.returnValue(throwError('error'));
                component.save();
                fixture.detectChanges();
                tick();
                expect(discoverStateStub.getInstance).toHaveBeenCalledWith();
                expect(exploreUtilsStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                expect(discoverStateStub.explore.instance.entity).toEqual([{'@id': 'test', '@type': ['test type']}]);
                expect(exploreServiceStub.updateInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.instance.metadata.instanceIRI, discoverStateStub.explore.instance.entity);
                expect(exploreServiceStub.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
            }));
        });
        it('cancel sets the correct variables', function() {
            discoverStateStub.explore.instance.original = [{'@id': 'original'}];
            discoverStateStub.explore.instance.entity = [{'@id': 'entity'}];
            component.cancel();
            expect(discoverStateStub.explore.instance.entity).toEqual(discoverStateStub.explore.instance.original);
            expect(discoverStateStub.explore.editing).toBe(false);
        });
    });
});
