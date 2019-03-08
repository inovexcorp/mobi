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
describe('Material Tabset component', function() {
    var $compile, $timeout, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
        });

        this.element = $compile(angular.element('<material-tabset></material-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('materialTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $timeout = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MATERIAL-TABSET');
            expect(this.element.querySelectorAll('.material-tabset').length).toEqual(1);
            expect(this.element.querySelectorAll('.material-tabset-headings').length).toEqual(1);
            expect(this.element.querySelectorAll('ul.nav-tabs').length).toEqual(1);
            expect(this.element.querySelectorAll('.material-tabset-contents').length).toEqual(1);
        });
        it('if the headings should be centered', function() {
            var tabs = angular.element(this.element.querySelectorAll('ul.nav-tabs'));
            expect(tabs.hasClass('justify-content-center')).toEqual(false);

            this.controller.isCentered = true;
            scope.$digest();
            expect(tabs.hasClass('justify-content-center')).toEqual(true);
        });
        it('depending on the number of tabs', function() {
            this.controller.tabs = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.nav-item').length).toEqual(1);
        });
        describe('if tab.hideTab is', function() {
            it('true', function() {
                this.controller.tabs = [{id: 'tab1', hideTab: true}];
                scope.$digest();
                expect(this.element.querySelectorAll('.nav-item').length).toEqual(0);
            });
            it('false', function() {
                this.controller.tabs = [{id: 'tab1', hideTab: false}];
                scope.$digest();
                var tabs = this.element.querySelectorAll('.nav-item');
                expect(tabs.length).toEqual(1);
                expect(angular.element(tabs[0]).hasClass('hide')).toEqual(false);
            });
        });
        describe('if tab.active is', function() {
            it('true', function() {
                this.controller.tabs = [{id: 'tab1', active: true}];
                scope.$digest();
                var tab = angular.element(this.element.querySelectorAll('.nav-item .nav-link')[0]);
                expect(tab.hasClass('active')).toEqual(true);
            });
            it('false', function() {
                this.controller.tabs = [{id: 'tab1', active: false}];
                scope.$digest();
                var tab = angular.element(this.element.querySelectorAll('.nav-item .nav-link')[0]);
                expect(tab.hasClass('active')).toEqual(false);
            });
        });
    });
    describe('controller methods', function() {
        it('addTab adds an element to the array', function() {
            this.controller.addTab({});
            expect(this.controller.tabs.length).toEqual(1);
        });
        it('removeTab removes an element from the array', function() {
            var tab = {id: 'tab1'};
            this.controller.tabs = [tab];
            this.controller.removeTab(tab);
            expect(this.controller.tabs).not.toContain(tab);
        });
        it('select sets the correct tab active and calls onClick', function() {
            var tab1 = {id: 'tab1', active: true, setActive: jasmine.createSpy('setActive1'), onClick: jasmine.createSpy('onClick1')};
            var tab2 = {id: 'tab2', active: false, setActive: jasmine.createSpy('setActive2'), onClick: jasmine.createSpy('onClick2')};
            this.controller.tabs = [tab1, tab2];
            this.controller.select(tab2);
            $timeout.flush();
            expect(tab1.setActive).toHaveBeenCalledWith({value: false});
            expect(tab2.setActive).toHaveBeenCalledWith({value: true});
            expect(tab2.onClick).toHaveBeenCalled();
        });
    });
});
