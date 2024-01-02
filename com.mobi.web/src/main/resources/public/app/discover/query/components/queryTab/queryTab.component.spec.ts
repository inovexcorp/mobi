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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError} from 'rxjs';

import { 
    cleanStylesFromDOM,
} from '../../../../../../public/test/ts/Shared';
import { POLICY } from '../../../../prefixes';
import { ErrorDisplayComponent } from '../../../../shared/components/errorDisplay/errorDisplay.component';
import { ProgressSpinnerService } from '../../../../shared/components/progress-spinner/services/progressSpinner.service';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { YasguiService } from '../../../../shared/services/yasgui.service';
import { DiscoverDatasetSelectComponent} from '../../../components/discoverDatasetSelect/discoverDatasetSelect.component';
import { QueryTabComponent } from './queryTab.component';
import { YasguiQuery } from '../../../../shared/models/yasguiQuery.class';

describe('Query Tab component', function() {
    let component: QueryTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<QueryTabComponent>;
    let yasguiStub: jasmine.SpyObj<YasguiService>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;

    let yasguiInstance;
    let tab;
    let yasqe;
    let yasr;

    const error = 'error message';
    const datasetRecordIRI = 'datasetRecordIRI';
    const fakeRequest = {
        resourceId: datasetRecordIRI,
        actionId: `${POLICY}Read`
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatButtonModule,
            ],
            declarations: [
                QueryTabComponent,
                MockComponent(DiscoverDatasetSelectComponent),
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                MockProvider(DiscoverStateService),
                MockProvider(YasguiService),
                MockProvider(ProgressSpinnerService),
                MockProvider(ToastService),
                MockProvider(PolicyEnforcementService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(QueryTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        yasguiStub = TestBed.inject(YasguiService) as jasmine.SpyObj<YasguiService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';

        discoverStateStub.query = new YasguiQuery();

        yasqe = {
            on: jasmine.createSpy('on'),
            getValue: jasmine.createSpy('getValue'),
            setValue: jasmine.createSpy('setValue'),
            config: {
                value: ''
            }
        };
        yasr = {
            on: jasmine.createSpy('on'),
            setResponse: jasmine.createSpy('setResponse')
        };
        tab = {
            yasqe,
            yasr,
            rootEl: undefined
        };
        yasguiInstance = jasmine.createSpyObj('yasgui', [
            'getTab',
            'handleYasrContainer'
        ]);
        yasguiInstance.getTab.and.returnValue(tab);
        yasguiStub.getYasgui.and.returnValue(yasguiInstance);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
        yasguiStub = null;
        toastStub = null;
        policyEnforcementStub = null;
        yasguiInstance = null;
        tab = null;
        yasqe = null;
        yasr = null;
    });

    describe('should initialize correctly', function() {
        beforeEach(function() {
            spyOn(component, 'setValues');
        });
        it('if yasgui was created', function() {
            component.ngOnInit();
            expect(yasguiStub.initYasgui).toHaveBeenCalledWith(component.discoverQuery.nativeElement, {name: 'discoverQuery'}, discoverStateStub.query);
            expect(yasguiStub.getYasgui).toHaveBeenCalledWith();
            expect(yasguiInstance.getTab).toHaveBeenCalledWith();
            expect(component.tab).toEqual(tab);
            expect(component.setValues).toHaveBeenCalledWith();
            expect(component.error).toEqual('');
        });
        it('unless yasgui was not created', function() {
            yasguiStub.getYasgui.and.returnValue(undefined);
            component.ngOnInit();
            expect(yasguiStub.initYasgui).toHaveBeenCalledWith(component.discoverQuery.nativeElement, {name: 'discoverQuery'}, discoverStateStub.query);
            expect(yasguiStub.getYasgui).toHaveBeenCalledWith();
            expect(yasguiInstance.getTab).not.toHaveBeenCalled();
            expect(component.tab).toEqual({});
            expect(component.setValues).not.toHaveBeenCalled();
            expect(component.error).toEqual(jasmine.stringContaining('Something went wrong'));
        });
    });
    describe('controller method', function() {
        it('onSelect should handle selecting a dataset ', function() {
            spyOn(component, 'permissionCheck');
            discoverStateStub.query.submitDisabled = true;
            discoverStateStub.query.recordId = '';
            component.onSelect({'recordId': datasetRecordIRI, recordTitle: 'title'});
            expect(discoverStateStub.query.submitDisabled).toEqual(false);
            expect(discoverStateStub.query.recordId).toEqual(datasetRecordIRI);
            expect(discoverStateStub.query.recordTitle).toEqual('title');
            expect(component.permissionCheck).toHaveBeenCalledWith(datasetRecordIRI);
        });
        describe('submitQuery should handle submitting a query', function() {
            beforeEach(function() {
                spyOn(component, 'createPepReadRequest').and.returnValue(fakeRequest);
            });
            describe('when a dataset is selected', function() {
                beforeEach(function() {
                    discoverStateStub.query.recordId = datasetRecordIRI;
                });
                it('unless an error occurs', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(throwError(error));
                    component.submitQuery();
                    tick();
                    expect(component.createPepReadRequest).toHaveBeenCalledWith(datasetRecordIRI);
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith(fakeRequest);
                    expect(progressSpinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
                    expect(yasguiStub.submitQuery).not.toHaveBeenCalled();
                    expect(progressSpinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(discoverStateStub.query.submitDisabled).toBeTrue();
                }));
                it('unless a deny is returned', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                    component.submitQuery();
                    tick();
                    expect(component.createPepReadRequest).toHaveBeenCalledWith(datasetRecordIRI);
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith(fakeRequest);
                    expect(progressSpinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
                    expect(yasguiStub.submitQuery).not.toHaveBeenCalled();
                    expect(progressSpinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(discoverStateStub.query.submitDisabled).toBeTrue();
                }));
                it('if a permit is returned', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                    component.submitQuery();
                    tick();
                    expect(component.createPepReadRequest).toHaveBeenCalledWith(datasetRecordIRI);
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith(fakeRequest);
                    expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.discoverQuery);
                    expect(yasguiStub.submitQuery).toHaveBeenCalledWith();
                    expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.discoverQuery);
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(discoverStateStub.query.submitDisabled).toBeFalse();
                }));
            });
            it('when a dataset is not selected', fakeAsync(function() {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                component.submitQuery();
                tick();
                expect(component.createPepReadRequest).not.toHaveBeenCalled();
                expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalled();
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.discoverQuery);
                expect(yasguiStub.submitQuery).toHaveBeenCalledWith();
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.discoverQuery);
                expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                expect(discoverStateStub.query.submitDisabled).toBeFalse();
            }));
        });
        describe('permissionCheck should evaluate whether the user can read a dataset', function() {
            beforeEach(function() {
                spyOn(component, 'createPepReadRequest').and.returnValue(fakeRequest);
            });
            describe('if a dataset is selected', function() {
                it('unless an error occurs', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(throwError(error));
                    component.permissionCheck(datasetRecordIRI);
                    tick();
                    expect(component.createPepReadRequest).toHaveBeenCalledWith(datasetRecordIRI);
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith(fakeRequest);
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(discoverStateStub.query.submitDisabled).toBeTrue();
                }));
                it('unless a deny is returned', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                    component.permissionCheck(datasetRecordIRI);
                    tick();
                    expect(component.createPepReadRequest).toHaveBeenCalledWith(datasetRecordIRI);
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith(fakeRequest);
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(discoverStateStub.query.submitDisabled).toBeTrue();
                }));
                it('if a permit is returned', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                    component.permissionCheck(datasetRecordIRI);
                    tick();
                    expect(component.createPepReadRequest).toHaveBeenCalledWith(datasetRecordIRI);
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith(fakeRequest);
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                    expect(discoverStateStub.query.submitDisabled).toBeFalse();
                }));
            });
            it('unless a dataset is not selected', async () => {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                component.permissionCheck(undefined);
                fixture.detectChanges();
                await fixture.whenStable();
                expect(component.createPepReadRequest).toHaveBeenCalledWith('http://mobi.com/system-repo');
                expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith(fakeRequest);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(toastStub.createWarningToast).not.toHaveBeenCalled();
                expect(discoverStateStub.query.submitDisabled).toBeFalse();
            });
        });
        it('createPepReadRequest returns a request object for reading a dataset', function() {
            expect(component.createPepReadRequest(datasetRecordIRI)).toEqual({
                resourceId: datasetRecordIRI,
                actionId: `${POLICY}Read`
            });
        });
        describe('setValues should initialize', function() {
            beforeEach(function() {
                component.yasgui = yasguiInstance;
                component.tab = tab;
            });
            it('the query if set', function() {
                discoverStateStub.query.queryString = 'query';
                component.setValues();
                expect(yasqe.setValue).toHaveBeenCalledWith('query');
                expect(yasr.setResponse).not.toHaveBeenCalled();
                expect(yasguiInstance.handleYasrContainer).not.toHaveBeenCalled();
            });
            it('the results if set', function() {
                delete yasqe.setValue;
                discoverStateStub.query.response = { test: 'test' };
                component.setValues();
                expect(yasr.setResponse).toHaveBeenCalledWith({ test: 'test' }, 0);
                expect(yasguiInstance.handleYasrContainer).toHaveBeenCalledWith();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.query-tab')).length).toBe(1);
        });
        ['.discover-query', 'form.sparql-form', 'button', '.btn-container', 'discover-dataset-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('depending on whether there is an error', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);

            component.error = error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether the submit button should be disabled', function() {
            const button = element.queryAll(By.css('button'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();

            discoverStateStub.query.submitDisabled = true;
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
    });
    it('should call submitQuery when the button is clicked', function() {
        spyOn(component, 'submitQuery');
        const button = element.queryAll(By.css('button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.submitQuery).toHaveBeenCalledWith();
    });
});
