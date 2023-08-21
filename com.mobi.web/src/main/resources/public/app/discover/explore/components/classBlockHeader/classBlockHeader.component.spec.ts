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
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError} from 'rxjs';

import { 
    cleanStylesFromDOM
 } from '../../../../../../public/test/ts/Shared';
import { DatasetSelectComponent } from '../../../../shared/components/datasetSelect/datasetSelect.component';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { NewInstanceClassOverlayComponent } from '../newInstanceClassOverlay/newInstanceClassOverlay.component';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ClassBlockHeaderComponent } from './classBlockHeader.component';
import { ProgressSpinnerService } from '../../../../shared/components/progress-spinner/services/progressSpinner.service';

describe('Class Block Header component', function() {
    let component: ClassBlockHeaderComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassBlockHeaderComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let exploreUtilsServiceStub: jasmine.SpyObj<ExploreUtilsService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let toastStub: jasmine.SpyObj<ToastService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ClassBlockHeaderComponent,
                MockComponent(DatasetSelectComponent),
            ],
            providers: [
                MockProvider(ExploreService),
                MockProvider(DiscoverStateService),
                MockProvider(ExploreUtilsService),
                MockProvider(ToastService),
                MockProvider(PolicyEnforcementService),
                MockProvider(ProgressSpinnerService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    }) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ClassBlockHeaderComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        exploreServiceStub = TestBed.inject(ExploreService) as jasmine.SpyObj<ExploreService>;
        exploreUtilsServiceStub = TestBed.inject(ExploreUtilsService) as jasmine.SpyObj<ExploreUtilsService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';

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
        matDialog = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('form.class-block-header')).length).toEqual(1);
        });
        ['dataset-select', 'button.refresh-button', '.fa.fa-refresh', 'button.create-button', '.fa.fa-plus'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('depending on whether a dataset is selected', function() {
            fixture.detectChanges();
            const refreshButton = element.queryAll(By.css('button.refresh-button'))[0];
            const createButton = element.queryAll(By.css('button.create-button'))[0];

            expect(refreshButton.nativeElement.disabled).withContext('refreshButton toBeTruthy').toBeTruthy();
            expect(createButton.nativeElement.disabled).withContext('createButton toBeTruthy').toBeTruthy();

            discoverStateStub.explore.recordId = 'dataset';
            
            fixture.detectChanges();
            expect(refreshButton.nativeElement.disabled).withContext('createButton toBeFalsy').toBeFalsy();
            expect(createButton.nativeElement.disabled).withContext('createButton toBeFalsy').toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('showCreate calls the proper methods when getClasses', function() {
            beforeEach(function() {
                discoverStateStub.explore.recordId = 'recordId';
            });
            it('resolves', fakeAsync (function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                exploreUtilsServiceStub.getClasses.and.returnValue(of([{id: '', title: '', deprecated: false}]));
                component.showCreate();
                fixture.detectChanges();
                tick();
                exploreUtilsServiceStub.getClasses(discoverStateStub.explore.recordId).subscribe(() => {
                    expect(matDialog.open).toHaveBeenCalledWith(NewInstanceClassOverlayComponent,
                {data: { content: [{id: '', title: '', deprecated: false}]}
                    });
                });
            }));
            it('rejects', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                exploreUtilsServiceStub.getClasses.and.returnValue(throwError('Error message'));
                component.showCreate();
                fixture.detectChanges();
                tick();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialog.open).not.toHaveBeenCalled();
            }));
            it('no modify permission', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                // policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                component.showCreate();
                fixture.detectChanges();
                tick();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('You don\'t have permission to modify dataset');
                expect(matDialog.open).not.toHaveBeenCalled();
            }));
        });
        describe('onSelect calls the proper methods', function() {
            it('when value parameter is not an empty string', function() {
                spyOn(component, 'refresh');
                component.onSelect('recordId');
                fixture.detectChanges();
                expect(discoverStateStub.explore.recordId).toEqual('recordId');
                expect(component.refresh).toHaveBeenCalledWith();
            });
            it('when value parameter is an empty string', function() {
                spyOn(component, 'refresh');
                component.onSelect('');
                fixture.detectChanges();
                expect(discoverStateStub.explore.recordId).toEqual('');
                expect(component.refresh).not.toHaveBeenCalled();
            });
        });
        describe('refresh calls the proper methods when getClassDetails', function() {
            beforeEach(function() {
                discoverStateStub.explore.classDetails = []; // [{}]
                discoverStateStub.explore.recordId = 'recordId';
            });
            it('resolves and user have permissions to read', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                exploreServiceStub.getClassDetails.and.returnValue(of([{
                    classIRI: 'www.test.com',
                    classTitle: 'test',
                    classDescription: 'description',
                    instancesCount: 0,
                    classExamples: ['example'],
                    ontologyRecordTitle: 'testOntology',
                    deprecated: false
                }]));
                component.refresh();
                fixture.detectChanges();
                tick();
                exploreServiceStub.getClassDetails(discoverStateStub.explore.recordId).subscribe(() => {
                    expect(exploreServiceStub.getClassDetails).toHaveBeenCalledWith('recordId');
                    expect(discoverStateStub.explore.classDetails).toEqual([{
                        classIRI: 'www.test.com',
                        classTitle: 'test',
                        classDescription: 'description',
                        instancesCount: 0,
                        classExamples: ['example'],
                        ontologyRecordTitle: 'testOntology',
                        deprecated: false
                    }]);
                    expect(discoverStateStub.explore.hasPermissionError).toEqual(false);
                });
            }));
            it('rejects and user have permissions to read', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                exploreServiceStub.getClassDetails.and.returnValue(throwError('error'));
                component.refresh();
                fixture.detectChanges();
                tick();
                expect(exploreServiceStub.getClassDetails).toHaveBeenCalledWith('recordId');
                expect(discoverStateStub.explore.classDetails).toEqual([]);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
                expect(discoverStateStub.explore.hasPermissionError).toEqual(false);
            }));
            it('rejects and user does not have permission to read', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                exploreServiceStub.getClassDetails.and.returnValue(throwError('error'));
                component.refresh();
                fixture.detectChanges();
                tick();
                expect(exploreServiceStub.getClassDetails).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('You don\'t have permission to read dataset');
                expect(discoverStateStub.explore.hasPermissionError).toEqual(true);
                expect(discoverStateStub.explore.recordId).toEqual('');
                expect(discoverStateStub.explore.breadcrumbs).toEqual(['Classes']);
            }));
        });
    });
});
