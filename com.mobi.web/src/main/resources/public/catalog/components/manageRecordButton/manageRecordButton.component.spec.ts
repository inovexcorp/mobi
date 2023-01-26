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
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';

import {
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { ManageRecordButtonComponent } from './manageRecordButton.component';
import { of } from 'rxjs';

describe('Manage Record Button component', function() {
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let fixture: ComponentFixture<ManageRecordButtonComponent>;
    let component: ManageRecordButtonComponent;
    let element: DebugElement;
    let nativeElement: HTMLElement;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [
                ManageRecordButtonComponent
            ],
            providers: [
                MockProvider(PolicyManagerService),
                MockProvider(PolicyEnforcementService),
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ManageRecordButtonComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        nativeElement = element.nativeElement as HTMLElement;
        policyEnforcementStub = TestBed.get(PolicyEnforcementService);
        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));

        component.record = {
            '@id': 'recordId'
        };
        component.flat = false;
        component.stopPropagation = false;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        policyEnforcementStub = null;
    });

    describe('should initialize', function() {
        describe('showButton', function() {
            describe('to true', function() {
                it('when it is an ontology record and the user can view',  async function() {
                    component.ngOnInit();
                    fixture.detectChanges();
                    await fixture.whenStable();
                    expect(component.showButton).toEqual(true);
                });
            });
            describe('to false', function() {
                it('when record is undefined', function() {
                    this.record = undefined;
                    expect(component.showButton).toEqual(false);
                });
                it('when it is an ontology record and the user cannot view', async ()=> {
                    await policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                    fixture.detectChanges();
                    expect(component.showButton).toEqual(false);
                });
            });
        });
    });
    describe('controller methods', function() {
        describe('update set showButton variable', function() {
            it('to true when policyEnforcementService is permit', async function() {
                component.ngOnInit();
                fixture.detectChanges();
                await fixture.whenStable();
                expect(component.showButton).toEqual(true);
            });
            it('to false when policyEnforcementService is deny', async () => {
                policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                component.ngOnInit();
                fixture.detectChanges();
                await fixture.whenStable();
                expect(component.showButton).toEqual(false);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(component).toBeDefined();
            expect( element.query(By.css('.manage-record-button'))).toBeTruthy();
        });
        it('button type depending on whether isFlat(false) is set', async () => {
            component.showButton = true;
            component.isFlat = true;
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            const raisedButton = nativeElement.querySelectorAll('.btn-primary');
            const flatButton = nativeElement.querySelectorAll('.btn-flat-primary');
            expect(raisedButton.length).toEqual(0);
            expect(flatButton.length).toEqual(1);
        });
        it('button type depending on whether isFlat(true) is set', function() {
            component.showButton = true;
            component.isFlat = true;
            fixture.detectChanges();
            const raisedButton = nativeElement.querySelectorAll('.btn-primary');
            const flatButton = nativeElement.querySelectorAll('.btn-flat-primary');
            expect(raisedButton.length).toEqual(0);
            expect(flatButton.length).toEqual(1);
        });
        it('depending on showButton being true or false', function() {
            component.showButton = true;
            fixture.detectChanges();
            let button = nativeElement.querySelectorAll('.manage-record-button .btn');
            expect(button.length).toEqual(1);

            component.showButton = false;
            fixture.detectChanges();
            button = nativeElement.querySelectorAll('.manage-record-button .btn');
            expect(button.length).toEqual(0);
        });
        it('should call manageRecord when clicked', function() {
            spyOn(component, 'manageRecord');
            component.showButton = true;
            fixture.detectChanges();

            const button: HTMLElement = nativeElement.querySelector('.manage-record-button .btn');
            button.click();
            expect(component.manageRecord).toHaveBeenCalled();
        });
    });
});
