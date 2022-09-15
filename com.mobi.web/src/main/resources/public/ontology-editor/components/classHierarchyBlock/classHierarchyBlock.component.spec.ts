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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { HierarchyTreeComponent } from '../hierarchyTree/hierarchyTree.component';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ClassHierarchyBlockComponent } from './classHierarchyBlock.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';

describe('Class Hierarchy Block component', function() {
    let component: ClassHierarchyBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassHierarchyBlockComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ClassHierarchyBlockComponent,
                MockComponent(HierarchyTreeComponent),
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                MockProvider(OntologyStateService)
                // { provide: OntologyStateService, useClass: mockOntologyState }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassHierarchyBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyStateStub.listItem = new OntologyListItem();
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        ontologyStateStub = null;
        component = null;
        element = null;
        fixture = null;
    });

    describe('controller methods', function() {
        it('updateSearch changes classes search text', function() {
            expect(ontologyStateStub.listItem.editorTabStates.classes.searchText).toEqual('');
            component.updateSearch('newValue');
            expect(ontologyStateStub.listItem.editorTabStates.classes.searchText).toEqual('newValue');
        });
        it('resetIndex resets classes hierarchy index', function() {
            ontologyStateStub.listItem.editorTabStates.classes.index = 4;
            component.resetIndex();
            expect(ontologyStateStub.listItem.editorTabStates.classes.index).toEqual(0);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.class-hierarchy-block')).length).toEqual(1);
        });
        it('depending on whether the tree is empty', function() {
            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('hierarchy-tree')).length).toEqual(0);

            ontologyStateStub.listItem.classes.flat = [{entityInfo: undefined, entityIRI: '', hasChildren: false, joinedPath: '', path: [], indent: 0}];
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('hierarchy-tree')).length).toEqual(1);
        });
    });
});
