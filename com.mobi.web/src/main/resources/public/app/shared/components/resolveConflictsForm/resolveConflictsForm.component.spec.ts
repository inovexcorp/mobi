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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { Difference } from '../../models/difference.class';
import { CommitCompiledResourceComponent } from '../commitCompiledResource/commitCompiledResource.component';
import { Conflict } from '../../models/conflict.interface';
import { ResolveConflictsFormComponent } from './resolveConflictsForm.component';

describe('Resolve Conflicts Form component', function() {
    let component: ResolveConflictsFormComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ResolveConflictsFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule
            ],
            declarations: [
                ResolveConflictsFormComponent,
                MockComponent(CommitCompiledResourceComponent),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ResolveConflictsFormComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.branchTitle = '';
        component.targetTitle = '';
        component.conflicts = [];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        fixture = null;
        element = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.resolve-conflicts-form')).length).toEqual(1);
        });
        it('depending on how many conflicts there are', async function() {
            component.conflicts = [{iri: '', left: new Difference(), right: new Difference()}];
            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('.conflict-list-item')).length).toEqual(1);
        });
        it('depending on whether a conflict is resolved', async function() {
            component.conflicts = [{iri: '', left: new Difference(), right: new Difference(), resolved: false}, {iri: '', left: new Difference(), right: new Difference(), resolved: true}];
            fixture.detectChanges();
            await fixture.whenStable();

            const conflictItems = element.queryAll(By.css('.conflict-list-item'));
            expect(conflictItems[0].nativeElement.classList.contains('text-danger')).toEqual(true);
            expect(conflictItems[0].queryAll(By.css('i'))[0].nativeElement.classList.contains('fa-times')).toEqual(true);
            expect(conflictItems[1].nativeElement.classList.contains('text-success')).toEqual(true);
            expect(conflictItems[1].queryAll(By.css('i'))[0].nativeElement.classList.contains('fa-check')).toEqual(true);
        });
        it('depending on whether a conflict is selected', async function() {
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.list-info')).length).toEqual(1);
            expect(element.queryAll(By.css('.conflict-container')).length).toEqual(0);

            component.index = 0;
            component.selected = {
                iri: '',
                resolved: '',
                left: new Difference(),
                right: new Difference()
            };
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.list-info')).length).toEqual(0);
            expect(element.queryAll(By.css('.conflict-container')).length).toEqual(1);
        });
        it('depending on whether the first conflict is selected', async function() {
            component.index = 0;
            component.selected = {};
            fixture.detectChanges();
            await fixture.whenStable();

            let button = element.queryAll(By.css('.btn-navigation-container .prev-button'))[0];
            expect(button.properties['disabled']).toBeTruthy();

            component.index = 1;
            fixture.detectChanges();
            await fixture.whenStable();
            button = element.queryAll(By.css('.btn-navigation-container .prev-button'))[0];
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether there is a next conflict', async function() {
            component.index = 0;
            component.selected = {};
            const hasNextSpy = spyOn(component, 'hasNext');
            hasNextSpy.and.returnValue(true);

            fixture.detectChanges();
            await fixture.whenStable();

            const button = element.queryAll(By.css('.btn-navigation-container .next-button'))[0];
            expect(button.properties['disabled']).toBeFalsy();

            hasNextSpy.and.returnValue(false);
            fixture.detectChanges();
            await fixture.whenStable();

            expect(button.properties['disabled']).toBeTruthy();
        });
        it('depending on whether a conflict is resolved with left or right', async function() {
            component.index = 0;
            component.selected = {resolved: 'left'};
            fixture.detectChanges();
            await fixture.whenStable();

            const left = element.queryAll(By.css('.conflict.left .card'))[0];
            const right = element.queryAll(By.css('.conflict.right .card'))[0];

            expect(left.nativeElement.classList.contains('active')).toEqual(true);
            expect(left.nativeElement.classList.contains('not-selected')).toEqual(false);
            expect(right.nativeElement.classList.contains('active')).toEqual(false);
            expect(right.nativeElement.classList.contains('not-selected')).toEqual(true);

            component.selected = {resolved: 'right'};
            fixture.detectChanges();
            await fixture.whenStable();

            expect(left.nativeElement.classList.contains('active')).toEqual(false);
            expect(left.nativeElement.classList.contains('not-selected')).toEqual(true);
            expect(right.nativeElement.classList.contains('active')).toEqual(true);
            expect(right.nativeElement.classList.contains('not-selected')).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('should select a conflict', function() {
            const conflict: Conflict = {iri: '', left: new Difference(), right: new Difference()};
            component.conflicts = [conflict];
            component.select(0);
            expect(component.index).toEqual(0);
            expect(component.selected).toEqual(conflict);
        });
        it('should determine whether there is another conflict after the selected', function() {
            expect(component.hasNext()).toEqual(false);

            component.index = 0;
            component.conflicts = [{iri: '', left: new Difference(), right: new Difference()}, {iri: '', left: new Difference(), right: new Difference()}];
            expect(component.hasNext()).toEqual(true);

            component.index = 1;
            expect(component.hasNext()).toEqual(false);
        });
        it('should go back to the list of conflicts', function() {
            component.index = 0;
            component.selected = {};
            component.backToList();
            expect(component.index).toBeUndefined();
            expect(component.selected).toBeUndefined();
        });
    });
    it('should select a conflict to resolve when clicked', async function() {
        component.conflicts = [{iri: '', left: new Difference(), right: new Difference()}];
        fixture.detectChanges();
        await fixture.whenStable();
        spyOn(component, 'select');

        const span = element.queryAll(By.css('.conflict-list-item span'))[0];
        span.triggerEventHandler('click', null);
        expect(component.select).toHaveBeenCalledWith(0);
    });
    it('should navigate back to the list when the link is clicked', async function() {
        component.index = 0;
        component.selected = {};
        fixture.detectChanges();
        await fixture.whenStable();
        spyOn(component, 'backToList');

        const button = element.queryAll(By.css('a.back-to-list'))[0];
        button.triggerEventHandler('click', null);
        expect(component.backToList).toHaveBeenCalledWith();
    });
    it('should go to previous conflict when the button is clicked', async function() {
        component.index = 1;
        component.selected = {};
        fixture.detectChanges();
        await fixture.whenStable();
        spyOn(component, 'select');

        const button = element.queryAll(By.css('.btn-navigation-container .prev-button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.select).toHaveBeenCalledWith(0);
    });
    it('should go to next conflict when the button is clicked', async function() {
        component.index = 0;
        component.selected = {};
        fixture.detectChanges();
        await fixture.whenStable();
        spyOn(component, 'select');

        const button = element.queryAll(By.css('.btn-navigation-container .next-button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.select).toHaveBeenCalledWith(1);
    });
    it('should set the resolution when a side is clicked', async function() {
        component.index = 0;
        component.selected = {resolved: ''};
        fixture.detectChanges();
        await fixture.whenStable();

        const left = element.queryAll(By.css('.conflict.left .card'))[0];
        const right = element.queryAll(By.css('.conflict.right .card'))[0];
        left.triggerEventHandler('click', null);
        expect(component.selected.resolved).toEqual('left');
        right.triggerEventHandler('click', null);
        expect(component.selected.resolved).toEqual('right');
    });
});
