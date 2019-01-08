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
describe('Record Search component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.searchText = '';
        scope.search = jasmine.createSpy('search');
        this.element = $compile(angular.element('<record-search search-text="searchText" search="search(searchText)"></record-search>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordSearch');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('searchText is one way bound', function() {
            this.controller.searchText = 'test';
            scope.$digest();
            expect(scope.searchText).toEqual('');
        });
        it('search is called in the parent scope', function() {
            this.controller.search({searchText: 'test'});
            expect(scope.search).toHaveBeenCalledWith('test');
        });
    });
    describe('controller methods', function() {
        it('should search for records', function() {
            this.controller.searchText = 'test';
            this.controller.submitSearch();
            expect(scope.search).toHaveBeenCalledWith('test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORD-SEARCH');
            expect(this.element.querySelectorAll('.input-group').length).toBe(1);
        });
        it('with an input', function() {
            expect(this.element.find('input').length).toBe(1);
        });
        it('with a search button', function() {
            expect(this.element.find('button').length).toBe(1);
        });
    });
    it('should call search when the button is clicked', function() {
        spyOn(this.controller, 'search');
        var button = this.element.find('button');
        button.triggerHandler('click');
        expect(this.controller.search).toHaveBeenCalled();
    });
});