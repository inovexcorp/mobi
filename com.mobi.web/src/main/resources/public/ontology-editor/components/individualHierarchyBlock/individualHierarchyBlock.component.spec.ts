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

import {IndividualHierarchyBlockComponent} from './individualHierarchyBlock.component';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {OntologyStateService} from '../../../shared/services/ontologyState.service';
import { By } from '@angular/platform-browser';

import {configureTestSuite} from 'ng-bullet';
import {SharedModule} from '../../../shared/shared.module';
import {MockProvider, MockComponent} from 'ng-mocks';
import {IndividualTreeComponent} from '../individualTree/individualTree.component';
import {cleanStylesFromDOM} from '../../../../../../test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';

describe('Individual Hierarchy Block component', function() {
    let component: IndividualHierarchyBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<IndividualHierarchyBlockComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                IndividualHierarchyBlockComponent,
                MockComponent(IndividualTreeComponent),
            ],
            providers: [
                MockProvider(OntologyStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(IndividualHierarchyBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.get(OntologyStateService);

        ontologyStateServiceStub.listItem = new OntologyListItem();
        ontologyStateServiceStub.listItem.individuals.flat = [{
            entityIRI: 'www.test.com',
            hasChildren: false,
            indent: 0,
            path: ['www.test.com'],
            entityInfo: {
                label: 'test',
                names: ['test', 'sample']},
            joinedPath: 'www.test.com'
        }];

        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateServiceStub = null;
    });

    describe('controller methods', function() {
        it('updateSearch changes individuals search text', function() {
            expect(ontologyStateServiceStub.listItem.editorTabStates.individuals.searchText).toEqual('');
            component.updateSearch('newValue');
            expect(ontologyStateServiceStub.listItem.editorTabStates.individuals.searchText).toEqual('newValue');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.individual-hierarchy-block')).length).toEqual(1);
        });
        it('depending on whether the tree is empty', function() {
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('individual-tree')).length).toEqual(1);
            ontologyStateServiceStub.listItem.individuals.flat = [];
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('individual-tree')).length).toEqual(0);
        });
    });
});
