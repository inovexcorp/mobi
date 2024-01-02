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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { CommitDifferenceTabsetComponent } from '../../../shared/components/commitDifferenceTabset/commitDifferenceTabset.component';
import { BranchSelectComponent } from '../../../shared/components/branchSelect/branchSelect.component';
import { ToastService } from '../../../shared/services/toast.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { Difference } from '../../../shared/models/difference.class';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import {UserManagerService} from '../../../shared/services/userManager.service';
import {LoginManagerService} from '../../../shared/services/loginManager.service';
import { CATALOG } from '../../../prefixes';
import { MergeBlockComponent } from './mergeBlock.component';

describe('Merge Block component', function() {
    let component: MergeBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MergeBlockComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatCheckboxModule
            ],
            declarations: [
                MergeBlockComponent,
                MockComponent(CommitDifferenceTabsetComponent),
                MockComponent(BranchSelectComponent),
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(OntologyStateService),
                MockProvider(PolicyEnforcementService),
                MockProvider(UserManagerService),
                MockProvider(LoginManagerService),
                MockProvider(ToastService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MergeBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.versionedRdfRecord.branchId = 'branchId';
        ontologyStateStub.listItem.branches = [{'@id': 'branchId'}];
        ontologyStateStub.listItem.merge.checkbox = false;
        ontologyStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
        catalogManagerStub.localCatalog = {'@id': 'catalogId'};
        policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.merge-block')).length).toEqual(1);
        });
        ['branch-select', 'mat-checkbox'].forEach(item => {
            it('with a ' + item, function() {
                expect(element.queryAll(By.css(item)).length).toEqual(1);
            });
        });
        it('with a .merge-message', function() {
            expect(element.queryAll(By.css('.merge-message')).length).toEqual(1);
        });
        it('with buttons to submit and cancel', function() {
            const buttons = element.queryAll(By.css('.btn-container button'));
            expect(buttons.length).toEqual(2);
            expect(buttons[0].nativeElement.textContent.trim()).toEqual('Submit');
            expect(buttons[1].nativeElement.textContent.trim()).toEqual('Cancel');
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.error = 'Error';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on whether the branch is a UserBranch', function() {
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);

            ontologyStateStub.listItem.userBranch = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(0);
        });
        it('depending on whether the branch is the master branch', function() {
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(1);

            component.branchTitle = 'MASTER';
            ontologyStateStub.listItem.userBranch = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(0);
        });
        it('depending on whether a target has been selected', function() {
            expect(element.queryAll(By.css('.btn-container button[color="primary"][disabled]')).length).toEqual(1);
            expect(element.queryAll(By.css('commit-difference-tabset')).length).toEqual(0);

            ontologyStateStub.listItem.merge.target = {'@id': ''};
            component.commits = ['1'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('commit-difference-tabset')).length).toEqual(1);
            expect(element.queryAll(By.css('.btn-container button[color="primary"][disabled]')).length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        describe('should collect differences when changing the target branch', function() {
            beforeEach(function() {
                ontologyStateStub.listItem.merge.difference = new Difference();
            });
            it('unless the target is empty', function() {
                component.changeTarget(undefined);
                expect(ontologyStateStub.listItem.merge.target).toBeUndefined();
                expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
                expect(ontologyStateStub.listItem.merge.difference).toBeUndefined();
            });
            describe('when target is not empty', function() {
                const branch = {'@id': 'target'};
                beforeEach(function() {
                    catalogManagerStub.getRecordBranch.and.returnValue(of({'@id': 'branch1', [`${CATALOG}head`]: [{'@id': 'targetHead'}]}));
                });
                it('unless an error occurs', function() {
                    ontologyStateStub.getMergeDifferences.and.returnValue(throwError('Error'));
                    policyEnforcementStub.evaluateRequest.and.returnValue(of('Deny'));
                    component.changeTarget(branch);
                    fixture.detectChanges();
                    expect(ontologyStateStub.listItem.merge.target).toEqual(branch);
                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch['@id'], 'recordId', component.catalogId);
                    expect(ontologyStateStub.getMergeDifferences).toHaveBeenCalledWith('', 'targetHead', catalogManagerStub.differencePageSize, 0);
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
                    expect(ontologyStateStub.listItem.merge.difference).toBeUndefined();
                    expect(component.isSubmitDisabled).toBeTruthy();
                    expect(component.error).toEqual(component.permissionMessage);
                });
                it('successfully', function() {
                    ontologyStateStub.getMergeDifferences.and.returnValue(of(null));
                    component.changeTarget(branch);
                    fixture.detectChanges();
                    expect(ontologyStateStub.listItem.merge.target).toEqual(branch);
                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch['@id'], 'recordId', component.catalogId);
                    expect(ontologyStateStub.getMergeDifferences).toHaveBeenCalledWith('', 'targetHead', catalogManagerStub.differencePageSize, 0);
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    expect(component.isSubmitDisabled).toBeFalse();
                    expect(component.error).not.toEqual(component.permissionMessage);
                });
            });
        });
        describe('should submit the merge', function() {
            it('unless attemptMerge rejects', function() {
                ontologyStateStub.attemptMerge.and.returnValue(throwError('Error message'));
                component.submit();
                fixture.detectChanges();
                expect(ontologyStateStub.attemptMerge).toHaveBeenCalledWith();
                expect(ontologyStateStub.resetStateTabs).not.toHaveBeenCalled();
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.cancelMerge).not.toHaveBeenCalled();
                expect(component.error).toEqual('Error message');
            });
            it('if attemptMerge resolves', function() {
                ontologyStateStub.attemptMerge.and.returnValue(of(null));
                component.submit();
                fixture.detectChanges();
                expect(ontologyStateStub.attemptMerge).toHaveBeenCalledWith();
                expect(ontologyStateStub.resetStateTabs).toHaveBeenCalledWith();
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(ontologyStateStub.cancelMerge).toHaveBeenCalledWith();
                expect(component.error).toEqual('');
            });
        });
    });
    it('should call submit when the button is clicked', function() {
        spyOn(component, 'submit');
        const button = element.queryAll(By.css('.btn-container button[color="primary"]'))[0];

        button.triggerEventHandler('click', null);
        expect(component.submit).toHaveBeenCalledWith();
    });
    it('should call the correct method when the button is clicked', function() {
        const button = element.queryAll(By.css('.btn-container button:not([color="primary"])'))[0];

        button.triggerEventHandler('click', null);
        expect(ontologyStateStub.cancelMerge).toHaveBeenCalledWith();
    });
});
