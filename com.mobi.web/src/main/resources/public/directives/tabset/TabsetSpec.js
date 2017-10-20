/*-
 * #%L
 * com.mobi.web
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
describe('Tabset directive', function() {
    var $compile,
        element,
        $timeout,
        controller,
        scope;

    beforeEach(function() {
        module('templates');
        module('tabset');
        injectTrustedFilter();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
        });

        element = $compile(angular.element('<tabset></tabset>'))(scope);
        scope.$digest();
    });
    describe('contains the correct html', function() {
        it('for a DIV tag', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .tabset', function() {
            expect(element.hasClass('tabset')).toBe(true);
        });
        it('based on .tabset-headings', function() {
            expect(element.querySelectorAll('.tabset-headings').length).toBe(1);
        });
        it('based on .heading', function() {
            element.controller('tabset').tabs = [{}];
            scope.$digest();
            expect(element.querySelectorAll('.heading').length).toBe(1);
        });
        it('based on .tabset-contents', function() {
            expect(element.querySelectorAll('.tabset-contents').length).toBe(1);
        });
        describe('if tab.marked is', function() {
            beforeEach(function() {
                controller = element.controller('tabset');
            });
            it('true', function() {
                controller.tabs = [{id: 'tab1', marked: true}];
                scope.$digest();
                expect(element.querySelectorAll('.marked').length).toBe(1);
            });
            it('false', function() {
                controller.tabs = [{id: 'tab1', marked: false}];
                scope.$digest();
                expect(element.querySelectorAll('.marked').length).toBe(0);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('tabset');
        });
        it('addTab adds an element to the array', function() {
            controller.addTab({});
            expect(controller.tabs.length).toBe(1);
        });
        it('removeTab removes an element from the array', function() {
            var tab = {id: 'tab1'};
            controller.tabs = [tab];
            controller.removeTab(tab);
            expect(controller.tabs).not.toContain(tab);
        });
        it('select sets the active property to true for passed in tab and false for the others and calls onClick', function() {
            var tab1 = {id: 'tab1', active: true, onClick: jasmine.createSpy('onClick')};
            var tab2 = {id: 'tab2', active: false, onClick: jasmine.createSpy('onClick')};
            controller.tabs = [tab1, tab2];
            controller.select(tab2);
            $timeout.flush();
            expect(_.find(controller.tabs, {id: 'tab1'}).active).toBe(false);
            expect(_.find(controller.tabs, {id: 'tab2'}).active).toBe(true);
            expect(tab2.onClick).toHaveBeenCalled();
        });
    });
});
