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
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { TreeItemComponent } from './treeItem.component';
import { MockProvider } from 'ng-mocks';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';

describe('Tree Item component', function() {
    let component: TreeItemComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<TreeItemComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
            ],
            declarations: [
                TreeItemComponent,
            ],
            providers: [
                MockProvider(OntologyStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(TreeItemComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);

        ontologyStateStub.listItem = new OntologyListItem();
        component.hasChildren = true;
        component.isActive = false;
        spyOn(component.onClick, 'emit');
        spyOn(component.toggleOpen, 'emit');
        component.entityInfo = {
            label: 'label',
            names: ['name'],
            imported: false,
            ontologyId: 'ontologyId'
        };
        component.isOpened = true;
        component.path = '';
        component.inProgressCommit = {};
        component.currentIri = 'iri';

        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    it('should update on changes', function() {
        spyOn(component, 'isSaved').and.returnValue(true);
        component.ngOnChanges();
        expect(component.saved).toEqual(true);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.tree-item')).length).toEqual(1);
        });
        it('depending on whether or not the currentIri is saved', function() {
            expect(element.queryAll(By.css('.tree-item.saved')).length).toEqual(0);

            component.currentIri = 'id';
            component.inProgressCommit = {
                additions: [{'@id': 'id'}]
            };
            component.ngOnChanges();
            fixture.detectChanges();
            expect(element.queryAll(By.css('.tree-item.saved')).length).toEqual(1);
        });
        it('depending on whether it has children', function() {
            let anchor = element.queryAll(By.css('a'));
            expect(anchor.length).toEqual(1);
            expect(element.queryAll(By.css('i')).length).toEqual(2);

            component.hasChildren = false;
            component.ngOnChanges();
            fixture.detectChanges();
            anchor = element.queryAll(By.css('a'));
            expect(anchor.length).toEqual(1);
            expect(element.queryAll(By.css('i')).length).toEqual(2);
        });
        it('depending on whether it is active', function() {
            expect(element.queryAll(By.css('a.active')).length).toEqual(0);

            component.isActive = true;
            component.ngOnChanges();
            fixture.detectChanges();
            expect(element.queryAll(By.css('a.active')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('isSaved', function() {
            it('check correct value for inProgress.additions is returned', function() {
                component.currentIri = 'id';
                component.inProgressCommit = {
                    additions: [{'@id': '12345'}]
                }
                expect(component.isSaved()).toEqual(false);
                component.inProgressCommit = {
                    additions: [{'@id': 'id'}]
                }
                expect(component.isSaved()).toEqual(true);
            });
            it('check correct value for inProgress.deletions is returned', function() {
                component.currentIri = 'id';
                component.inProgressCommit = {
                    deletions: [{'@id': '12345'}]
                }
                expect(component.isSaved()).toEqual(false);
                component.inProgressCommit = {
                    deletions: [{'@id': 'id'}]
                }
                expect(component.isSaved()).toEqual(true);
            });
            it('check correct value for inProgress.additions and inProgress deletions is returned', function() {
                component.currentIri = 'id';
                component.inProgressCommit = {
                    additions: [{'@id': '12345'}],
                    deletions: [{'@id': '23456'}]
                };
                expect(component.isSaved()).toEqual(false);
            });
        });
    });
});
