/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
    mockSettingsManager,
    mockOntologyState,
    injectRegexConstant
} from '../../../../../../test/js/Shared';

describe('Tree Item component', function() {
    var $compile, scope, ontologyStateSvc, settingsManagerSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockSettingsManager();
        mockOntologyState();
        injectRegexConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _settingsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            settingsManagerSvc = _settingsManagerService_;
        });

        scope.hasChildren = true;
        scope.isActive = false;
        scope.onClick = jasmine.createSpy('onClick');
        scope.toggleOpen = jasmine.createSpy('toggleOpen');
        scope.currentEntity = {'@id': 'id'};
        scope.isOpened = true;
        scope.isBold = false;
        scope.path = '';
        scope.inProgressCommit = {};
        this.element = $compile(angular.element('<tree-item path="path" is-opened="isOpened" current-entity="currentEntity" is-active="isActive" on-click="onClick()" toggle-open="toggleOpen()" has-children="hasChildren" is-bold="isBold" in-progress-commit="inProgressCommit"></tree-item>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('treeItem');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        settingsManagerSvc = null;
        this.element.remove();
    });

    describe('should update on changes', function() {
        beforeEach(function() {
            spyOn(this.controller, 'isSaved').and.returnValue(true);
            spyOn(this.controller, 'getTreeDisplay').and.returnValue('test');
            settingsManagerSvc.getTreeDisplay.calls.reset();
        });
        it('if it is the first change', function() {
            settingsManagerSvc.getTreeDisplay.and.returnValue('test');
            this.controller.$onChanges({currentEntity: {isFirstChange: true}});
            expect(settingsManagerSvc.getTreeDisplay).toHaveBeenCalled();
            expect(this.controller.treeDisplaySetting).toEqual('test');
            expect(this.controller.saved).toEqual(true);
            expect(this.controller.treeDisplay).toEqual('test');
        });
        it('if it is not the first change', function() {
            settingsManagerSvc.getTreeDisplay.and.returnValue('test');
            this.controller.$onChanges({});
            expect(settingsManagerSvc.getTreeDisplay).not.toHaveBeenCalled();
            expect(this.controller.treeDisplaySetting).toEqual('');
            expect(this.controller.saved).toEqual(true);
            expect(this.controller.treeDisplay).toEqual('test');
        });
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
        it('currentEntity should be two way bound', function() {
            this.controller.currentEntity = {id: 'new'};
            scope.$digest();
            expect(this.controller.currentEntity).toEqual({id: 'new'});
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
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('TREE-ITEM');
            expect(this.element.querySelectorAll('.tree-item').length).toEqual(1);
        });
        it('depending on whether or not the currentEntity is saved', function() {
            expect(this.element.querySelectorAll('.tree-item.saved').length).toEqual(0);

            scope.currentEntity = {'@id': 'id'};
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
        it('depending on whether it is bold', function() {
            var span = this.element.find('span');
            expect(span.hasClass('bold')).toEqual(false);

            scope.isBold = true;
            scope.$digest();
            expect(span.hasClass('bold')).toEqual(true);
        });
    });
    describe('controller methods', function() {
        describe('getTreeDisplay', function() {
            beforeEach(function() {
                this.entityName = 'Entity Name';
                ontologyStateSvc.getEntityNameByIndex.and.returnValue(this.entityName);
            });
            it('should return anonymous when not pretty', function() {
                this.controller.currentEntity = {mobi: {anonymous: 'anon'}};
                expect(this.controller.getTreeDisplay()).toEqual('anon');
                expect(ontologyStateSvc.getEntityNameByIndex).not.toHaveBeenCalled();
            });
            it('should call getEntityNameByIndex if pretty', function() {
                this.controller.treeDisplaySetting = 'pretty';
                expect(this.controller.getTreeDisplay()).toEqual(this.entityName);
                expect(ontologyStateSvc.getEntityNameByIndex).toHaveBeenCalledWith('id', ontologyStateSvc.listItem);
            });
        });
        describe('isSaved', function() {
            it('check correct value for inProgress.additions is returned', function() {
                this.controller.currentEntity = {'@id': 'id'};
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
                this.controller.currentEntity = {'@id': 'id'};
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
                this.controller.currentEntity = {'@id': 'id'};
                this.controller.inProgressCommit = {
                    additions: [{'@id': '12345'}],
                    deletions: [{'@id': '23456'}]
                }
                expect(this.controller.isSaved()).toEqual(false);
            });
        });
    });
});
