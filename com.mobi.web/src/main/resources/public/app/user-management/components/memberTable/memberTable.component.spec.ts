/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { User } from '../../../shared/models/user.class';
import { FOAF, USER } from '../../../prefixes';
import { MemberTableComponent } from './memberTable.component';

describe('Member Table component', function() {
    let component: MemberTableComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MemberTableComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;

    const user1: User = new User({
        '@id': 'user1',
        '@type': [`${USER}User`],
        [`${USER}username`]: [{ '@value': 'user1' }],
        [`${FOAF}firstName`]: [{ '@value': 'John' }],
        [`${FOAF}lastName`]: [{ '@value': 'Doe' }],
    });
    const user2: User = new User({
      '@id': 'user2',
      '@type': [`${USER}User`],
      [`${USER}username`]: [{ '@value': 'test2' }],
      [`${FOAF}firstName`]: [{ '@value': 'Jane' }],
      [`${FOAF}lastName`]: [{ '@value': 'Doe' }],
  });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatTableModule,
                NoopAnimationsModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                MemberTableComponent
            ],
            providers: [
              MockProvider(UserManagerService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MemberTableComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        userManagerStub.users = [user1];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('controller methods', function() {
        it('should handle removing a member', function() {
            spyOn(component.removeMember, 'emit');
            component.emitRemoveMember('test');
            expect(component.removeMember.emit).toHaveBeenCalledWith('test');
        });
        it('should change updates to the list of members', function() {
            expect(component.dataSource).toEqual([]);
            component.members = ['user1'];
            component.ngOnChanges();
            expect(component.dataSource).toEqual([user1]);
        });
    });
    describe('contains with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.member-table')).length).toEqual(1);
        });
        it('with the correct number of rows for members', function() {
            component.dataSource = [user1, user2];
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-row')).length).toEqual(component.dataSource.length);
        });
        it('with delete buttons per member', function() {
            component.dataSource = [user1, user2];
            fixture.detectChanges();
            expect(element.queryAll(By.css('button.mat-icon-button')).length).toEqual(component.dataSource.length);
        });
        it('depending on whether the table is read only', function() {
            component.dataSource = [user1];
            component.readOnly = true;
            fixture.detectChanges();
            const removeButton = element.query(By.css('button.mat-icon-button'));
            expect(removeButton.properties['disabled']).toBeTruthy();
        });
    });
    it('should call emitRemoveMember when a delete button is clicked', function() {
        component.dataSource = [user1];
        fixture.detectChanges();
        spyOn(component, 'emitRemoveMember');
        
        const button = element.query(By.css('button.mat-icon-button'));
        button.triggerEventHandler('click', null);
        expect(component.emitRemoveMember).toHaveBeenCalledWith('user1');
    });
});
