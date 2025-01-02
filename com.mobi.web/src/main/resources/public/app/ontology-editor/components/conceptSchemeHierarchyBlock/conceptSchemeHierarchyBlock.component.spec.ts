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
import { MockComponent, MockProvider } from 'ng-mocks';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { SharedModule } from '../../../shared/shared.module';
import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ConceptSchemeHierarchyBlockComponent } from './conceptSchemeHierarchyBlock.component';
import { HierarchyTreeComponent } from '../hierarchyTree/hierarchyTree.component';

describe('Concept Scheme Hierarchy Block component', function() {
    let component: ConceptSchemeHierarchyBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ConceptSchemeHierarchyBlockComponent>;
    let ontologyStateServiceStub: jasmine.SpyObj<OntologyStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SharedModule],
            declarations: [
                ConceptSchemeHierarchyBlockComponent,
                MockComponent(HierarchyTreeComponent)
            ],
            providers: [
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ConceptSchemeHierarchyBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateServiceStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;

        ontologyStateServiceStub.listItem = new OntologyListItem();
        ontologyStateServiceStub.listItem.conceptSchemes.flat = [{
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
        fixture = null;
        component = null;
        element = null;
        ontologyStateServiceStub = null;
    });

    describe('controller methods', function() {
        it('updateSearch changes schemes search text', function() {
            expect(ontologyStateServiceStub.listItem.editorTabStates.schemes.searchText).toEqual('');
            component.updateSearch('newValue');
            expect(ontologyStateServiceStub.listItem.editorTabStates.schemes.searchText).toEqual('newValue');
        });
        it('resetIndex resets schemes hierarchy index', function() {
            ontologyStateServiceStub.listItem.editorTabStates.schemes.index = 4;
            component.resetIndex();
            expect(ontologyStateServiceStub.listItem.editorTabStates.schemes.index).toEqual(0);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.concept-scheme-hierarchy-block')).length).toEqual(1);
        });
        it('depending on whether the tree is empty', function() {
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('hierarchy-tree')).length).toEqual(1);
            ontologyStateServiceStub.listItem.conceptSchemes.flat = [];
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('hierarchy-tree')).length).toEqual(0);
        });
    });
});
