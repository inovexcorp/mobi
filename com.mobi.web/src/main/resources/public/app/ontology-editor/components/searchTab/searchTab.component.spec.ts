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
import { MockComponent, MockProvider } from 'ng-mocks';
import { SearchTabComponent } from './searchTab.component';
import { FindViewComponent } from '../find-view/find-view.component';
import { QueryViewComponent } from '../query-view/query-view.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';

describe('Search Tab component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<SearchTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    beforeEach(async () =>  {
        await TestBed.configureTestingModule({
            declarations: [
                SearchTabComponent,
                MockComponent(FindViewComponent),
                MockComponent(QueryViewComponent)
            ],
            providers: [
                MockProvider(OntologyStateService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SearchTabComponent);
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyStateStub.listItem = new OntologyListItem();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.nativeElement.querySelectorAll('.search-tab').length).toEqual(1);
        });
        it('to display find view', function() {
            fixture.detectChanges();
            expect(element.nativeElement.querySelectorAll('find-view').length).toEqual(1);
        });
        it('to display query view', function() {
            ontologyStateStub.listItem.editorTabStates.search.openIndex = 1;
            fixture.detectChanges();
            expect(element.nativeElement.querySelectorAll('query-view').length).toEqual(1);
        });
    });
});
