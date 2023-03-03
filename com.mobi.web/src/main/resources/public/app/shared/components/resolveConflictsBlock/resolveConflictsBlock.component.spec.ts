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
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../services/versionedRdfState.service';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { ResolveConflictsFormComponent } from '../resolveConflictsForm/resolveConflictsForm.component';
import { OntologyStateService } from '../../services/ontologyState.service';
import { UtilService } from '../../services/util.service';
import { ResolveConflictsBlock } from './resolveConflictsBlock.component';

describe('Resolve Conflicts Block component', function() {
    let component: ResolveConflictsBlock;
    let element: DebugElement;
    let fixture: ComponentFixture<ResolveConflictsBlock>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let stateStub;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ResolveConflictsBlock,
                MockComponent(ErrorDisplayComponent),
                MockComponent(ResolveConflictsFormComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(UtilService)
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ResolveConflictsBlock);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        stateStub = MockProvider(VersionedRdfState).provide;
        stateStub.listItem = new VersionedRdfListItem();
        stateStub.merge = jasmine.createSpy('merge').and.returnValue(of(null));
        stateStub.resetStateTabs = jasmine.createSpy('resetStateTabs');
        stateStub.cancelMerge = jasmine.createSpy('cancelMerge');
        component.state = stateStub;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        fixture = null;
        element = null;
        utilStub = null;
        stateStub = null;
    });

    describe('should initialize with the correct data for', function() {
        it('state', function() {
            expect(component.state).toEqual(stateStub);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.resolve-conflicts-block')).length).toEqual(1);
        });
        it('with a resolve-conflicts-form', function() {
            expect(element.queryAll(By.css('resolve-conflicts-form')).length).toEqual(1);
        });
        it('with buttons to submit with resolutions and cancel', function() {
            const buttons = element.queryAll(By.css('.btn-container button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit with Resolutions'].includes(buttons[0].nativeElement.textContent.trim())).toBeTrue();
            expect(['Cancel', 'Submit with Resolutions'].includes(buttons[1].nativeElement.textContent.trim())).toBeTrue();
        });
        it('depending on whether there is an error', async function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.error = 'Error';
            await fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('depending on the value of the merge checkbox', async function() {
            expect(element.queryAll(By.css('.merge-details p')).length).toEqual(1);
            stateStub.listItem.merge.checkbox = true;
            await fixture.detectChanges();
            expect(element.queryAll(By.css('.merge-details p')).length).toEqual(2);
        });
        it('depending on whether all conflicts are resolved', async function() {
            stateStub.listItem.merge.conflicts = [{}];
            const allResolvedSpy = spyOn(component, 'allResolved');
            allResolvedSpy.and.returnValue(false);
            await fixture.detectChanges();
            let button = element.queryAll(By.css('.btn-container button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeTruthy();

            allResolvedSpy.and.returnValue(true);
            await fixture.detectChanges();
            button = element.queryAll(By.css('.btn-container button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether the source branch is up to date', async function() {
            const button = element.queryAll(By.css('.btn-container button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeFalsy();

            stateStub.listItem.upToDate = false;
            await fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should test whether all conflicts are resolved', function() {
            expect(component.allResolved()).toEqual(true);

            stateStub.listItem.merge.conflicts = [{resolved: true}];
            expect(component.allResolved()).toEqual(true);

            stateStub.listItem.merge.conflicts = [{resolved: false}];
            expect(component.allResolved()).toEqual(false);
        });
        describe('should submit the merge', function() {
            beforeEach(function() {
                const selectedLeft = {resolved: 'left', right: {additions: ['add-right'], deletions: ['del-right']}};
                const selectedRight = {resolved: 'right', left: {additions: ['add-left'], deletions: ['del-left']}};
                stateStub.listItem.merge.conflicts = [selectedLeft, selectedRight];
            });
            it('unless merge rejects', async function() {
                stateStub.merge.and.returnValue(throwError('Error message'));
                await component.submit();
                expect(stateStub.listItem.merge.resolutions.additions).toEqual([]);
                expect(stateStub.listItem.merge.resolutions.deletions).toEqual(['add-right', 'add-left']);
                expect(stateStub.merge).toHaveBeenCalledWith();
                expect(stateStub.resetStateTabs).not.toHaveBeenCalled();
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(stateStub.cancelMerge).not.toHaveBeenCalled();
                expect(component.error).toEqual('Error message');
            });
            it('if merge resolves', async function() {
                await component.submit();
                expect(stateStub.listItem.merge.resolutions.additions).toEqual([]);
                expect(stateStub.listItem.merge.resolutions.deletions).toEqual(['add-right', 'add-left']);
                expect(stateStub.merge).toHaveBeenCalledWith();
                expect(stateStub.resetStateTabs).toHaveBeenCalledWith();
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(stateStub.cancelMerge).toHaveBeenCalledWith();
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
        expect(stateStub.cancelMerge).toHaveBeenCalledWith();
    });
});
