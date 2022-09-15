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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { Difference } from '../../models/difference.class';
import { CommitChangesDisplayComponent } from '../commitChangesDisplay/commitChangesDisplay.component';
import { CommitHistoryTableComponent } from '../commitHistoryTable/commitHistoryTable.component';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { CommitDifferenceTabsetComponent } from './commitDifferenceTabset.component';

describe('Commit Difference Tabset component', function() {
     let component: CommitDifferenceTabsetComponent;
     let element: DebugElement;
     let fixture: ComponentFixture<CommitDifferenceTabsetComponent>;
    
     configureTestSuite(function() {
         TestBed.configureTestingModule({
             imports: [
                 MatTabsModule,
                 NoopAnimationsModule
             ],
             declarations: [
                 CommitDifferenceTabsetComponent,
                 MockComponent(CommitChangesDisplayComponent),
                 MockComponent(CommitHistoryTableComponent),
                 MockComponent(InfoMessageComponent),
             ],
             providers: []
         });
     });
     
    beforeEach(function() {
        fixture = TestBed.createComponent(CommitDifferenceTabsetComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.branchTitle = '';
        component.commitId = '';
        component.targetId = '';
        component.difference = new Difference();
        component.entityNameFunc = jasmine.createSpy('entityNameFunc');
        component.recordId = 'recordId';
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize with the correct value for', function() {
        it('commitId', function() {
            expect(component.commitId).toEqual('');
        });
        it('branchTitle', function() {
            expect(component.branchTitle).toEqual('');
        });
        it('targetId', function() {
            expect(component.targetId).toEqual('');
        });
        it('difference', function() {
            expect(component.difference).toEqual(new Difference());
        });
        it('entityNameFunc', function() {
            expect(component.entityNameFunc).toBeDefined();
        });
        it('startIndex', function() {
            expect(component.startIndex).toBeUndefined();
        });
        it('recordId', function() {
            expect(component.recordId).toEqual('recordId');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.commit-difference-tabset')).length).toEqual(1);
        });
        it('with .mat-tab-labels', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.mat-tab-label')).length).toEqual(2);
        });
        it('with a mat-tab-group', function() {
            fixture.detectChanges();
            expect(element.query(By.css('mat-tab-group'))).toBeTruthy();
        });
        it('with a commit-changes-display', fakeAsync(function() {
            component.difference = new Difference();
            component.difference.additions = [{'@id': ''}];
            component.difference.deletions = [];
            fixture.detectChanges();
            element.queryAll(By.css('.mat-tab-label'))[0].nativeElement.click();
            fixture.detectChanges();
            tick();
            fixture.detectChanges();
            expect(element.query(By.css('commit-changes-display'))).toBeTruthy();
        }));
        it('with an info-message', fakeAsync(function() {
            component.difference = new Difference();
            fixture.detectChanges();
            element.queryAll(By.css('.mat-tab-label'))[0].nativeElement.click();
            fixture.detectChanges();
            tick();
            fixture.detectChanges();
            expect(element.query(By.css('info-message'))).toBeTruthy();
        }));
        it('with a commit-history-table', fakeAsync(function() {
            component.difference = new Difference();
            fixture.detectChanges();
            element.queryAll(By.css('.mat-tab-label'))[1].nativeElement.click();
            fixture.detectChanges();
            tick();
            fixture.detectChanges();
            expect(element.query(By.css('commit-history-table'))).toBeTruthy();
        }));
    });
});
