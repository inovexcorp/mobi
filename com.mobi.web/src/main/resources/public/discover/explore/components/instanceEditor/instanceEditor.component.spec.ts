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
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import { MatDialog, MatDivider } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockDirective, MockProvider } from 'ng-mocks';
import { throwError, of } from 'rxjs';

import { 
    cleanStylesFromDOM, mockPolicyEnforcement, mockUtil
 } from '../../../../../../../test/ts/Shared';
import { BreadcrumbsComponent } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { InstanceFormComponent } from '../instanceForm/instanceForm.component';
import { InstanceEditorComponent } from './instanceEditor.component';
import { HttpResponse } from '@angular/common/http';
import { InstanceDetails } from '../../../models/instanceDetails.interface';
import _ = require('lodash');

describe('Instance Editor component', function() {
    let component: InstanceEditorComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<InstanceEditorComponent>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let utilServiceStub: jasmine.SpyObj<any>;
    let policyEnforcementStub: jasmine.SpyObj<any>;
    let exploreUtilsServiceStub: jasmine.SpyObj<ExploreUtilsService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'policyEnforcementService', useClass: mockPolicyEnforcement },
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
                MockProvider('prefixes', 'prefixes'),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(InstanceEditorComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        exploreServiceStub = TestBed.get(ExploreService);
        discoverStateStub = TestBed.get(DiscoverStateService);
        utilServiceStub = TestBed.get('utilService');
        policyEnforcementStub = TestBed.get('policyEnforcementService');
        exploreUtilsServiceStub = TestBed.get(ExploreUtilsService);

        discoverStateStub.explore = {
            breadcrumbs: ['Classes'],
            classDeprecated: false,
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                entity: [],
                metadata:   {instanceIRI: 'instanceIRI',
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
            expect(element.queryAll(By.css('mat-divider')).length).toBe(1);        });
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
                exploreUtilsServiceStub.removeEmptyPropertiesFromArray.and.returnValue([{'@id': 'test', '@type': ['test type']}]);
            });
            describe('resolved and getClassInstanceDetails is', function() {
                beforeEach(function() {
                    this.instanceIRI = discoverStateStub.explore.instance.metadata.instanceIRI;
                    exploreServiceStub.updateInstance.and.returnValue(of(''));
                });
                it('resolved', fakeAsync(function() {
                    let data = [{
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
                    expect(discoverStateStub.getInstance).toHaveBeenCalled();
                    exploreServiceStub.updateInstance(discoverStateStub.explore.recordId,
                        discoverStateStub.explore.instance.metadata.instanceIRI,
                        discoverStateStub.explore.instance.entity).subscribe(result =>
                    {
                        expect(exploreUtilsServiceStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                        expect(discoverStateStub.explore.instance.entity).toEqual([{'@id': 'test', '@type': ['test type']}]);
                        expect(exploreServiceStub.updateInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, this.instanceIRI, discoverStateStub.explore.instance.entity);
                        expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {offset: (discoverStateStub.explore.instanceDetails.currentPage - 1) * discoverStateStub.explore.instanceDetails.limit, limit: discoverStateStub.explore.instanceDetails.limit});
                        expect(discoverStateStub.explore.instanceDetails.data).toEqual(data);
                        expect(discoverStateStub.explore.instance.metadata).toEqual({instanceIRI: 'test', title: 'test title', description: 'test description'});
                        expect(_.last(discoverStateStub.explore.breadcrumbs)).toBe('test title');
                        expect(discoverStateStub.explore.editing).toEqual(false);
                    })
                }));
                it('rejected', fakeAsync(function()  {
                    exploreServiceStub.getClassInstanceDetails.and.returnValue(throwError('error'));
                    component.save();
                    fixture.detectChanges();
                    tick();
                    expect(discoverStateStub.getInstance).toHaveBeenCalled();
                    expect(exploreUtilsServiceStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                    expect(discoverStateStub.explore.instance.entity).toEqual([{'@id': 'test', '@type': ['test type']}]);
                    expect(exploreServiceStub.updateInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, this.instanceIRI, discoverStateStub.explore.instance.entity);
                    expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.classId, {offset: (discoverStateStub.explore.instanceDetails.currentPage - 1) * discoverStateStub.explore.instanceDetails.limit, limit: discoverStateStub.explore.instanceDetails.limit});
                    expect(utilServiceStub.createErrorToast).toHaveBeenCalledWith('error');
                }));
            });
            it('rejected', fakeAsync(function() {
                exploreServiceStub.updateInstance.and.returnValue(throwError('error'));
                component.save();
                fixture.detectChanges();
                tick();
                expect(discoverStateStub.getInstance).toHaveBeenCalled();
                expect(exploreUtilsServiceStub.removeEmptyPropertiesFromArray).toHaveBeenCalledWith([this.instance]);
                expect(discoverStateStub.explore.instance.entity).toEqual([{'@id': 'test', '@type': ['test type']}]);
                expect(exploreServiceStub.updateInstance).toHaveBeenCalledWith(discoverStateStub.explore.recordId, discoverStateStub.explore.instance.metadata.instanceIRI, discoverStateStub.explore.instance.entity);
                expect(exploreServiceStub.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(utilServiceStub.createErrorToast).toHaveBeenCalledWith('error');
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
