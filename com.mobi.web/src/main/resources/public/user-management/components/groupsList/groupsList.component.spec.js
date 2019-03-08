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
describe('Groups List component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('user-management');
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.groups = [];
        scope.searchText = '';
        scope.selectedGroup = undefined;
        scope.clickEvent = jasmine.createSpy('clickEvent');
        this.element = $compile(angular.element('<groups-list groups="groups" search-text="searchText" selected-group="selectedGroup" click-event="clickEvent(group)"></groups-list>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('groupsList');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('groups should be one way bound', function() {
            this.controller.groups = [{}];
            scope.$digest();
            expect(scope.groups).toEqual([]);
        });
        it('searchText should be one way bound', function() {
            this.controller.searchText = 'test';
            scope.$digest();
            expect(scope.searchText).toEqual('');
        });
        it('selectedGroup should be one way bound', function() {
            this.controller.selectedGroup = {};
            scope.$digest();
            expect(scope.selectedGroup).toBeUndefined();
        });
        it('clickEvent should be called in the parent scope', function() {
            this.controller.clickEvent({group: {}});
            expect(scope.clickEvent).toHaveBeenCalledWith({});
        });
    });
    describe('should initialize with the correct values for', function() {
        describe('filteredGroups if', function() {
            beforeEach(function() {
                this.controller.groups = [{title: 'group1', members: []}];
            });
            it('searchText is provided', function() {
                var originalGroups = angular.copy(this.controller.groups);
                this.controller.searchText = 'gr';
                this.controller.$onInit();
                expect(this.controller.filteredGroups).toEqual(originalGroups);

                this.controller.searchText = 'test';
                this.controller.$onInit();
                expect(this.controller.filteredGroups).toEqual([]);
            });
            it('searchText is not provided', function() {
                var originalGroups = angular.copy(this.controller.groups);
                this.controller.$onInit();
                expect(this.controller.filteredGroups).toEqual(originalGroups);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('GROUPS-LIST');
            expect(this.element.querySelectorAll('.groups-list').length).toEqual(1);
        });
        it('depending on how many groups there are', function() {
            expect(this.element.find('li').length).toEqual(0);

            this.controller.filteredGroups = [{title: 'group', members: []}];
            scope.$digest();
            expect(this.element.find('li').length).toEqual(this.controller.filteredGroups.length);
        });
        it('depending on which group is selected', function() {
            var group = {title: 'group', members: []};
            this.controller.filteredGroups = [group];
            scope.$digest();
            var groupLink = angular.element(this.element.querySelectorAll('li a')[0]);
            expect(groupLink.hasClass('active')).toEqual(false);

            this.controller.selectedGroup = group;
            scope.$digest();
            expect(groupLink.hasClass('active')).toEqual(true);
        });
    });
    it('should call clickEvent when a group is clicked', function() {
        var group = {title: 'group', members: []};
        this.controller.filteredGroups = [group];
        scope.$digest();

        var groupLink = angular.element(this.element.querySelectorAll('li a')[0]);
        groupLink.triggerHandler('click');
        expect(scope.clickEvent).toHaveBeenCalledWith(group);
    });
});