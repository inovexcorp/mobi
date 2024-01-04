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
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { ResolveConflictsFormComponent } from '../resolveConflictsForm/resolveConflictsForm.component';
import { Difference } from '../../models/difference.class';
import { Conflict } from '../../models/conflict.interface';
import { ResolveConflictsBlock } from './resolveConflictsBlock.component';

describe('Resolve Conflicts Block component', function() {
    let component: ResolveConflictsBlock;
    let element: DebugElement;
    let fixture: ComponentFixture<ResolveConflictsBlock>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ResolveConflictsBlock,
                MockComponent(ErrorDisplayComponent),
                MockComponent(ResolveConflictsFormComponent)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ResolveConflictsBlock);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        component.listItem = new VersionedRdfListItem();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        fixture = null;
        element = null;
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
            component.listItem.merge.checkbox = true;
            await fixture.detectChanges();
            expect(element.queryAll(By.css('.merge-details p')).length).toEqual(2);
        });
        it('depending on whether all conflicts are resolved', async function() {
            component.listItem.merge.conflicts = [{iri: '', left: new Difference(), right: new Difference()}];
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

            component.listItem.upToDate = false;
            await fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should test whether all conflicts are resolved', function() {
            expect(component.allResolved()).toEqual(true);

            component.listItem.merge.conflicts = [{iri: '', left: new Difference(), right: new  Difference(), resolved: true}];
            expect(component.allResolved()).toEqual(true);

            component.listItem.merge.conflicts = [{iri: '', left: new Difference(), right: new  Difference(), resolved: false}];
            expect(component.allResolved()).toEqual(false);
        });
        it('should submit the merge', function() {
            const selectedLeft: Conflict = {iri: '', resolved: 'left', right: new Difference([{'@id': 'add-right'}], [{'@id': 'del-right'}]), left: new Difference()};
            const selectedRight: Conflict = {iri: '', resolved: 'right', right: new Difference(), left: new Difference([{'@id': 'add-left'}], [{'@id': 'del-left'}])};
            component.listItem.merge.conflicts = [selectedLeft, selectedRight];
            spyOn(component.submitEvent, 'emit');
            component.submit();
            expect(component.listItem.merge.resolutions.additions).toEqual([]);
            expect(component.listItem.merge.resolutions.deletions).toEqual([{'@id': 'add-right'}, {'@id': 'add-left'}]);
            expect(component.submitEvent.emit).toHaveBeenCalledWith();
        });
        it('should cancel the merge', function() {
            spyOn(component.cancelEvent, 'emit');
            component.cancelMerge();
            expect(component.cancelEvent.emit).toHaveBeenCalledWith();
        });
    });
    it('should call submit when the button is clicked', function() {
        spyOn(component, 'submit');
        const button = element.queryAll(By.css('.btn-container button[color="primary"]'))[0];
        button.triggerEventHandler('click', null);
        expect(component.submit).toHaveBeenCalledWith();
    });
    it('should call the cancelMerge when the button is clicked', function() {
        spyOn(component, 'cancelMerge');
        const button = element.queryAll(By.css('.btn-container button:not([color="primary"])'))[0];
        button.triggerEventHandler('click', null);
        expect(component.cancelMerge).toHaveBeenCalledWith();
    });
});
