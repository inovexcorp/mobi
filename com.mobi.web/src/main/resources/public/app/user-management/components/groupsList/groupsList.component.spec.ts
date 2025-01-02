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
import { By } from '@angular/platform-browser';
import { MockPipe } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { Group } from '../../../shared/models/group.interface';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { GroupsListComponent } from './groupsList.component';

describe('Groups List component', function() {
    let component: GroupsListComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<GroupsListComponent>;

    let group: Group;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                GroupsListComponent,
                MockPipe(HighlightTextPipe)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GroupsListComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        group = {
            title: 'group',
            description: '',
            roles: [],
            members: [],
            external: false
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        group = null;
    });

    describe('controller methods', function() {
        it('provide tracking info for the list', function() {
            expect(component.trackByFn(0, group)).toEqual(group.title);
        });
        it('should handle clicking a group', function() {
            spyOn(component.clickEvent, 'emit');
            component.clickGroup(group);
            expect(component.clickEvent.emit).toHaveBeenCalledWith(group);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.groups-list')).length).toEqual(1);
        });
        it('depending on how many groups there are', function() {
            expect(element.queryAll(By.css('li')).length).toEqual(0);

            component.groups = [group];
            fixture.detectChanges();
            expect(element.queryAll(By.css('li')).length).toEqual(component.groups.length);
        });
        it('depending on which group is selected', function() {
            component.groups = [group];
            fixture.detectChanges();
            const groupLink = element.query(By.css('li a'));
            expect(groupLink.classes.active).toEqual(undefined);

            component.selectedGroup = group;
            fixture.detectChanges();
            expect(groupLink.classes.active).toBeTrue();
        });
        it('depending on whether a group is external', function() {
            group.external = true;
            component.groups = [group];
            fixture.detectChanges();
            const item = element.query(By.css('li'));
            expect(item.classes.external).toBeTrue();
        });
    });
    it('should call clickGroup when a group is clicked', function() {
        component.groups = [group];
        fixture.detectChanges();
        spyOn(component, 'clickGroup');

        const groupLink = element.query(By.css('li a'));
        groupLink.triggerEventHandler('click', null);
        expect(component.clickGroup).toHaveBeenCalledWith(group);
    });
});
