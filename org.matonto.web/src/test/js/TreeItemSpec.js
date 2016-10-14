/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

describe('Tree Item directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc,
        ontologyManagerSvc,
        settingsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('treeItem');
        injectRegexConstant();
        mockSettingsManager();
        mockOntologyManager();
        mockOntologyState();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _settingsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            settingsManagerSvc = _settingsManagerService_;
        });

        scope.hasChildren = false;
        scope.isActive = false;
        scope.onClick = jasmine.createSpy('onClick');
        scope.currentEntity = {};
        scope.isOpened = true;
        scope.isBold = false;
        scope.path = '';
    });

    describe('in isolated scope', function() {
        var isolatedScope;

        beforeEach(function() {
            element = $compile(angular.element('<tree-item path="path" is-bold="isBold" is-opened="isOpened" current-entity="currentEntity" is-active="isActive" on-click="onClick()" has-children="hasChildren"></tree-item>'))(scope);
            scope.$digest();
            isolatedScope = element.isolateScope();
            controller = element.controller('treeItem');
        });
        it('hasChildren should be one way bound', function() {
            isolatedScope.hasChildren = true;
            scope.$digest();
            expect(scope.hasChildren).toBe(false);
        });
        it('isActive should be one way bound', function() {
            isolatedScope.isActive = true;
            scope.$digest();
            expect(scope.isActive).toBe(false);
        });
        it('isBold should be one way bound', function() {
            isolatedScope.isBold = true;
            scope.$digest();
            expect(scope.isBold).toBe(false);
        });
        it('onClick should be called in parent scope when invoked', function() {
            isolatedScope.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
        it('currentEntity should be two way bound', function() {
            controller.currentEntity = {id: 'new'};
            scope.$digest();
            expect(controller.currentEntity).toEqual({id: 'new'});
        });
        it('isOpened should be two way bound', function() {
            controller.isOpened = false;
            scope.$digest();
            expect(controller.isOpened).toEqual(false);
        });
        it('path should be two way bound', function() {
            controller.path = 'new';
            scope.$digest();
            expect(controller.path).toEqual('new');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<tree-item path="path" is-bold="isBold" is-opened="isOpened" current-entity="currentEntity" is-active="isActive" on-click="onClick()" has-children="hasChildren"></tree-item>'))(scope);
        });
        it('for an li', function() {
            scope.$digest();
            expect(element.prop('tagName')).toBe('LI');
        });
        describe('depending on if hasChildren', function() {
            describe('is false', function() {
                beforeEach(function() {
                    scope.hasChildren = false;
                    scope.$digest();
                });
                it('and it has an anchor', function() {
                    var anchors = element.find('a');
                    expect(anchors.length).toBe(1);
                });
                it('and it has one icons', function() {
                    var icons = element.find('i');
                    expect(icons.length).toBe(1);
                });
            });
            describe('is true', function() {
                beforeEach(function() {
                    scope.hasChildren = true;
                    scope.$digest();
                });
                it('and it has an anchor', function() {
                    var anchors = element.find('a');
                    expect(anchors.length).toBe(1);
                });
                it('and it has one icons', function() {
                    var icons = element.find('i');
                    expect(icons.length).toBe(1);
                });
                it('and it has an anchor with a double click attribute', function() {
                    var anchors = element.querySelectorAll('[ng-dblclick]');
                    expect(anchors.length).toBe(1);
                });
            });
        });
        describe('when isActive', function() {
            it('is true', function() {
                scope.isActive = true;
                scope.$digest();
                var anchor = element.find('a')[0];
                expect(angular.element(anchor).hasClass('active')).toBe(true);
            });
            it('is false', function() {
                scope.isActive = false;
                scope.$digest();
                var anchor = element.find('a')[0];
                expect(angular.element(anchor).hasClass('active')).toBe(false);
            });
        });
        describe('when isBold', function() {
            it('is true', function() {
                scope.isBold = true;
                scope.$digest();
                var strong = element.querySelectorAll('.bold');
                expect(strong.length).toBe(1);
            });
            it('is false', function() {
                scope.isBold = false;
                scope.$digest();
                var strong = element.querySelectorAll('.bold');
                expect(strong.length).toBe(0);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.hasChildren = true;
            scope.isActive = false;
            scope.onClick = jasmine.createSpy('onClick');
            scope.currentEntity = {};
            element = $compile(angular.element('<tree-item path="path" is-opened="isOpened" current-entity="currentEntity" is-active="isActive" on-click="onClick()" has-children="hasChildren"></tree-item>'))(scope);
            scope.$digest();
            controller = element.controller('treeItem');
        });
        describe('getTreeDisplay', function() {
            it('should return originalIRI when not pretty', function() {
                scope.currentEntity = {matonto: {originalIRI: 'originalIRI', anonymous: 'anon'}};
                scope.$digest();
                var result = controller.getTreeDisplay();
                expect(result).toBe('originalIRI');
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
            });
            it('should return anonymous when not pretty and no originalIRI', function() {
                scope.currentEntity = {matonto: {anonymous: 'anon'}};
                scope.$digest();
                var result = controller.getTreeDisplay();
                expect(result).toBe('anon');
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
            });
            it('should call getEntityName if pretty', function() {
                settingsManagerSvc.getTreeDisplay.and.returnValue('pretty');
                element = $compile(angular.element('<tree-item path="path" is-opened="isOpened" current-entity="currentEntity" is-active="isActive" on-click="onClick()" has-children="hasChildren"></tree-item>'))(scope);
                scope.$digest();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(controller.currentEntity, ontologyStateSvc.state.type);
            });
        });
        describe('toggleOpen', function() {
            it('should call correct manager function', function() {
                scope.currentEntity = {matonto: {originalIRI: 'originalIRI', anonymous: 'anon'}};
                scope.$digest();
                controller.toggleOpen();
                expect(ontologyStateSvc.setOpened).toHaveBeenCalledWith(controller.path, controller.isOpened);
            });
            it('should return true when not set', function() {
                controller.isOpened = undefined;
                controller.toggleOpen();
                expect(controller.isOpened).toBe(true);
            });
            it('should return true if it is false', function() {
                controller.isOpened = false;
                controller.toggleOpen();
                expect(controller.isOpened).toBe(true);
            });
            it('should return false if it is true', function() {
                controller.isOpened = true;
                controller.toggleOpen();
                expect(controller.isOpened).toBe(false);
            });
            it('should be called when double clicked', function() {
                spyOn(controller, 'toggleOpen');
                var anchor = element.querySelectorAll('a')[0];
                angular.element(anchor).triggerHandler('dblclick');
                expect(controller.toggleOpen).toHaveBeenCalled();
            });
        });
    });
});
