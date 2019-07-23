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
describe('Tree Item directive', function() {
    var $compile, scope, ontologyStateSvc, settingsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('treeItem');
        injectRegexConstant();
        mockSettingsManager();
        mockOntologyState();

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
        this.element = $compile(angular.element('<tree-item path="path" is-opened="isOpened" current-entity="currentEntity" is-active="isActive" on-click="onClick()" toggle-open="toggleOpen()" has-children="hasChildren" is-bold="isBold"></tree-item>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('treeItem');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        settingsManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('hasChildren should be one way bound', function() {
            this.controller.hasChildren = false;
            scope.$digest();
            expect(scope.hasChildren).toBe(true);
        });
        it('isActive should be one way bound', function() {
            this.controller.isActive = true;
            scope.$digest();
            expect(scope.isActive).toBe(false);
        });
        it('isBold should be one way bound', function() {
            this.controller.isBold = true;
            scope.$digest();
            expect(scope.isBold).toBe(false);
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
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('tree-item')).toBe(true);
        });
        it('depending on whether or not the currentEntity is saved', function() {
            expect(this.element.hasClass('saved')).toBe(false);

            scope.currentEntity = {'@id': 'id'};
            ontologyStateSvc.listItem.inProgressCommit = {
                additions: [{'@id': 'id'}]
            }
            scope.$digest();
            expect(this.element.hasClass('saved')).toBe(true);
        });
        it('depending on whether it has children', function() {
            var anchor = this.element.find('a');
            expect(anchor.length).toBe(1);
            expect(anchor.attr('ng-dblclick')).toBeTruthy();
            expect(this.element.find('i').length).toBe(2);

            scope.hasChildren = false;
            scope.$digest();
            var anchor = this.element.find('a');
            expect(anchor.length).toBe(1);
            expect(anchor.attr('ng-dblclick')).toBeFalsy();
            expect(this.element.find('i').length).toBe(2);
        });
        it('depending on whether it is active', function() {
            var anchor = this.element.find('a');
            expect(anchor.hasClass('active')).toBe(false);

            scope.isActive = true;
            scope.$digest();
            expect(anchor.hasClass('active')).toBe(true);
        });
        it('depending on whether it is bold', function() {
            var span = this.element.find('span');
            expect(span.hasClass('bold')).toBe(false);

            scope.isBold = true;
            scope.$digest();
            expect(span.hasClass('bold')).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('getTreeDisplay', function() {
            it('should return anonymous when not pretty', function() {
                scope.currentEntity = {mobi: {anonymous: 'anon'}};
                scope.$digest();
                var result = this.controller.getTreeDisplay();
                expect(result).toBe('anon');
                expect(ontologyStateSvc.getEntityNameByIndex).not.toHaveBeenCalled();
            });
            it('should call getEntityNameByIndex if pretty', function() {
                settingsManagerSvc.getTreeDisplay.and.returnValue('pretty');
                this.element = $compile(angular.element('<tree-item path="path" is-opened="isOpened" current-entity="currentEntity" is-active="isActive" on-click="onClick()" has-children="hasChildren"></tree-item>'))(scope);
                scope.$digest();
                expect(ontologyStateSvc.getEntityNameByIndex).toHaveBeenCalledWith('id', ontologyStateSvc.listItem);
            });
        });
        describe('isSaved', function() {
            it('check correct value for inProgress.additions is returned', function() {
                this.controller.currentEntity = {'@id': 'id'};
                ontologyStateSvc.listItem.inProgressCommit = {
                    additions: [{'@id': '12345'}]
                }
                expect(this.controller.isSaved()).toBe(false);
                ontologyStateSvc.listItem.inProgressCommit = {
                    additions: [{'@id': 'id'}]
                }
                expect(this.controller.isSaved()).toBe(true);
            });
            it('check correct value for inProgress.deletions is returned', function() {
                this.controller.currentEntity = {'@id': 'id'};
                ontologyStateSvc.listItem.inProgressCommit = {
                    deletions: [{'@id': '12345'}]
                }
                expect(this.controller.isSaved()).toBe(false);
                ontologyStateSvc.listItem.inProgressCommit = {
                    deletions: [{'@id': 'id'}]
                }
                expect(this.controller.isSaved()).toBe(true);
            });
            it('check correct value for inProgress.additions and inProgress deletions is returned', function() {
                this.controller.currentEntity = {'@id': 'id'};
                ontologyStateSvc.listItem.inProgressCommit = {
                    additions: [{'@id': '12345'}],
                    deletions: [{'@id': '23456'}]
                }
                expect(this.controller.isSaved()).toBe(false);
            });
        });
        describe('scope.$watch', function() {
            it('should call isSaved when additions is changed', function() {
                spyOn(this.controller, 'isSaved');
                scope.currentEntity = {'@id': 'id'};
                ontologyStateSvc.listItem.inProgressCommit = {
                    additions: [{'@id': 'id'}]
                }
                scope.$digest();
                expect(this.controller.isSaved).toHaveBeenCalled();
            });
            it('should call isSaved when deletions is changed', function() {
                spyOn(this.controller, 'isSaved');
                scope.currentEntity = {'@id': 'id'};
                ontologyStateSvc.listItem.inProgressCommit = {
                    deletions: [{'@id': 'id'}]
                }
                scope.$digest();
                expect(this.controller.isSaved).toHaveBeenCalled();
            });
        });
    });
});
