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
import { MergeTabComponent } from './mergeTab.component';
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DebugElement } from '@angular/core';
import { cleanStylesFromDOM, mockOntologyState } from '../../../../../../test/ts/Shared';
import { MockComponent } from 'ng-mocks';
import { MergeBlockComponent } from '../mergeBlock/mergeBlock.component';
import { ResolveConflictsBlock } from '../../../shared/components/resolveConflictsBlock/resolveConflictsBlock.component';
import { By } from '@angular/platform-browser';

describe('Merge Tab component', function() {
    let component: MergeTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MergeTabComponent>;
    let ontologyStateStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                MergeTabComponent,
                MockComponent(MergeBlockComponent),
                MockComponent(ResolveConflictsBlock)
            ],
            providers: [
                { provide: OntologyStateService, useClass: mockOntologyState },
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MergeTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
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
            expect(element.queryAll(By.css('.merge-tab')).length).toEqual(1);
        });
        it('depending on whether there are conflicts', function() {
            expect(element.queryAll(By.css('merge-block')).length).toEqual(1);
            expect(element.queryAll(By.css('resolve-conflicts-block')).length).toEqual(0);

            ontologyStateStub.listItem.merge.conflicts = [{}];
            fixture.detectChanges();
            expect(element.queryAll(By.css('merge-block')).length).toEqual(0);
            expect(element.queryAll(By.css('resolve-conflicts-block')).length).toEqual(1);
        });
    });
});
