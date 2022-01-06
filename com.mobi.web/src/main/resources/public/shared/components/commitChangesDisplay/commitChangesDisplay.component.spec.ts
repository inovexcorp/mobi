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

import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { map, range } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent } from 'ng-mocks';
import { cleanStylesFromDOM, mockUtil } from '../../../../../../test/ts/Shared';
import { StatementContainerComponent } from '../statementContainer/statementContainer.component';
import { StatementDisplayComponent } from '../statementDisplay/statementDisplay.component';
import { CommitChangesDisplayComponent } from './commitChangesDisplay.component';

describe('Commit Changes Display component', function() {
    let component: CommitChangesDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitChangesDisplayComponent>;
    let utilStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                CommitChangesDisplayComponent,
                MockComponent(StatementContainerComponent),
                MockComponent(StatementDisplayComponent)
            ],
            providers: [
                { provide: 'utilService', useClass: mockUtil }
            ]
        });
    });
    
    beforeEach(function() {
        fixture = TestBed.createComponent(CommitChangesDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.get('utilService');
        utilStub.getPredicateLocalNameOrdered.and.callFake(changes => {
            return changes;
        });

        component.additions = [];
        component.deletions = [];
        component.entityNameFunc = jasmine.createSpy('entityNameFunc');
        component.showMoreResultsFunc = jasmine.createSpy('showMoreResultsFunc');
        component.hasMoreResults = false;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        utilStub = null;
    });

    describe('should initialize with the correct data for', function() {
        it('additions', function() {
            expect(component.additions).toEqual([]);
        });
        it('deletions', function() {
            expect(component.deletions).toEqual([]);
        });
        it('entityNameFunc', function() {
            expect(component.entityNameFunc).toBeDefined();
        });
        it('hasMoreResults', function() {
            expect(component.hasMoreResults).toBeFalsy();
        });
        it('startIndex', function() {
            expect(component.startIndex).toBeUndefined();
        });
    });
    describe('controller methods', function() {
        it('ngOnChanges should produce current number of list elements', function() {
            component.additions = map(range(0, 150), i => ({'@id': `${i}`}));
            component.deletions = map(range(50, 200), i => ({'@id': `${i}`}));
            utilStub.getChangesById.and.returnValue([]);
            component.ngOnChanges({
                additions: new SimpleChange(null, {}, true),
                deletions: new SimpleChange(null, {}, true)
            });
            expect(component.list.length).toEqual(200);
            expect(component.results).toEqual(jasmine.objectContaining({
                '1': {additions: [], deletions: []},
                '3': {additions: [], deletions: []}
            }));
        });
        it('should add paged changes to results', function() {
            component.list = ['3', '4'];
            component.hasMoreResults = true;
            component.showMore = false;
            component.size = 2;
            component.index = 2;
            this.additions = [{'@id': 'add'}];
            this.deletions = [{'@id': 'del'}];
            component.additions = this.additions;
            component.deletions = this.deletions;
            component.results = {
                '1': {additions: this.additions, deletions: this.deletions},
                '2': {additions: this.additions, deletions: this.deletions}
            };
            utilStub.getChangesById.and.callFake((id, arr) => arr);
            component.addPagedChangesToResults();
            expect(utilStub.getChangesById).toHaveBeenCalledWith('3', component.additions);
            expect(utilStub.getChangesById).toHaveBeenCalledWith('3', component.deletions);
            expect(utilStub.getChangesById).toHaveBeenCalledWith('4', component.additions);
            expect(utilStub.getChangesById).toHaveBeenCalledWith('4', component.deletions);
            expect(component.results).toEqual({
                '1': {additions: this.additions, deletions: this.deletions},
                '2': {additions: this.additions, deletions: this.deletions},
                '3': {additions: this.additions, deletions: this.deletions},
                '4': {additions: this.additions, deletions: this.deletions}
            });
            expect(component.showMore).toEqual(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.commit-changes-display')).length).toEqual(1);
        });
        it('depending on whether there are additions and deletions', async function() {
            expect(element.queryAll(By.css('div.property-values')).length).toEqual(0);

            component.list = ['id'];
            component.results = {'id': {additions: [''], deletions: []}};
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('div.property-values')).length).toEqual(component.list.length);
        });
        it('depending on whether there are additions', async function() {
            expect(element.queryAll(By.css('statement-container')).length).toEqual(0);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(0);
            component.list = ['id'];
            component.results = {'id': {additions: [''], deletions: []}};
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('statement-container')).length).toEqual(1);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(1);
        });
        it('depending on whether there are deletions', async function() {
            expect(element.queryAll(By.css('statement-container')).length).toEqual(0);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(0);
            component.list = ['id'];
            component.results = {'id': {additions: [], deletions: ['']}};
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('statement-container')).length).toEqual(1);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(1);
        });
        it('depending on whether there are additions and deletions', async function() {
            expect(element.queryAll(By.css('statement-container')).length).toEqual(0);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(0);
            component.list = ['id'];
            component.results = {'id': {additions: [''], deletions: ['']}};
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('statement-container')).length).toEqual(2);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(2);
        });
    });
});
