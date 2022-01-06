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
import {
    mockOntologyState,
    injectRegexConstant
} from '../../../../../../test/js/Shared';

describe('Tree Item component', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockOntologyState();
        injectRegexConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        scope.hasChildren = true;
        scope.isActive = false;
        scope.onClick = jasmine.createSpy('onClick');
        scope.toggleOpen = jasmine.createSpy('toggleOpen');
        scope.entityInfo = {
            label: 'label',
            names: ['name'],
            imported: false,
            ontologyId: 'ontologyId'
        };
        scope.isOpened = true;
        scope.isBold = false;
        scope.path = '';
        scope.inProgressCommit = {};
        scope.iri = 'iri';
        this.element = $compile(angular.element('<tree-item path="path" is-opened="isOpened" entity-info="entityInfo" is-active="isActive" on-click="onClick()" toggle-open="toggleOpen()" has-children="hasChildren" is-bold="isBold" in-progress-commit="inProgressCommit" current-iri="iri"></tree-item>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('treeItem');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    it('should update on changes', function() {
        spyOn(this.controller, 'isSaved').and.returnValue(true);
        this.controller.$onChanges();
        expect(this.controller.saved).toEqual(true);
    });
    describe('controller bound variable', function() {
        it('hasChildren should be one way bound', function() {
            this.controller.hasChildren = false;
            scope.$digest();
            expect(scope.hasChildren).toEqual(true);
        });
        it('isActive should be one way bound', function() {
            this.controller.isActive = true;
            scope.$digest();
            expect(scope.isActive).toEqual(false);
        });
        it('isBold should be one way bound', function() {
            this.controller.isBold = true;
            scope.$digest();
            expect(scope.isBold).toEqual(false);
        });
        it('onClick should be called in parent scope', function() {
            this.controller.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
        it('toggleOpen should be called in parent scope', function() {
            this.controller.toggleOpen();
            expect(scope.toggleOpen).toHaveBeenCalled();
        });
        it('entityInfo should be two way bound', function() {
            this.controller.entityInfo = {label: 'new'};
            scope.$digest();
            expect(this.controller.entityInfo).toEqual({label: 'new'});
        });
        it('isOpened should be two way bound', function() {
            this.controller.isOpened = false;
            scope.$digest();
            expect(this.controller.isOpened).toEqual(false);
        });
        it('path should be two way bound', function() {
            this.controller.path = 'new';
            scope.$digest();
            expect(this.controller.path).toEqual('new');
        });
        it('inProgressCommit should be one way bound', function() {
            var original = angular.copy(scope.inProgressCommit);
            this.controller.inProgressCommit = {test: true};
            scope.$digest();
            expect(scope.inProgressCommit).toEqual(original);
        });
        it('iri should be one way bound', function() {
            var original = angular.copy(scope.iri);
            this.controller.iri = 'new';
            scope.$digest();
            expect(scope.iri).toEqual(original);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('TREE-ITEM');
            expect(this.element.querySelectorAll('.tree-item').length).toEqual(1);
        });
        it('depending on whether or not the currentIri is saved', function() {
            expect(this.element.querySelectorAll('.tree-item.saved').length).toEqual(0);

            scope.iri = 'id';
            scope.inProgressCommit = {
                additions: [{'@id': 'id'}]
            };
            scope.$digest();
            expect(this.element.querySelectorAll('.tree-item.saved').length).toEqual(1);
        });
        it('depending on whether it has children', function() {
            var anchor = this.element.find('a');
            expect(anchor.length).toEqual(1);
            expect(anchor.attr('ng-dblclick')).toBeTruthy();
            expect(this.element.find('i').length).toEqual(2);

            scope.hasChildren = false;
            scope.$digest();
            var anchor = this.element.find('a');
            expect(anchor.length).toEqual(1);
            expect(anchor.attr('ng-dblclick')).toBeFalsy();
            expect(this.element.find('i').length).toEqual(2);
        });
        it('depending on whether it is active', function() {
            var anchor = this.element.find('a');
            expect(anchor.hasClass('active')).toEqual(false);

            scope.isActive = true;
            scope.$digest();
            expect(anchor.hasClass('active')).toEqual(true);
        });
    });
    describe('controller methods', function() {
        describe('isSaved', function() {
            it('check correct value for inProgress.additions is returned', function() {
                this.controller.currentIri = 'id';
                this.controller.inProgressCommit = {
                    additions: [{'@id': '12345'}]
                }
                expect(this.controller.isSaved()).toEqual(false);
                this.controller.inProgressCommit = {
                    additions: [{'@id': 'id'}]
                }
                expect(this.controller.isSaved()).toEqual(true);
            });
            it('check correct value for inProgress.deletions is returned', function() {
                this.controller.currentIri = 'id';
                this.controller.inProgressCommit = {
                    deletions: [{'@id': '12345'}]
                }
                expect(this.controller.isSaved()).toEqual(false);
                this.controller.inProgressCommit = {
                    deletions: [{'@id': 'id'}]
                }
                expect(this.controller.isSaved()).toEqual(true);
            });
            it('check correct value for inProgress.additions and inProgress deletions is returned', function() {
                this.controller.currentIri = 'id';
                this.controller.inProgressCommit = {
                    additions: [{'@id': '12345'}],
                    deletions: [{'@id': '23456'}]
                }
                expect(this.controller.isSaved()).toEqual(false);
            });
        });
    });
});
