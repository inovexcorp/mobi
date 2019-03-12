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
describe('Column Select component', function() {
    var $compile, scope, delimitedManagerSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockDelimitedManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        scope.selectedColumn = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        delimitedManagerSvc.dataRows = [[[]]];
        this.element = $compile(angular.element('<column-select selected-column="selectedColumn" change-event="changeEvent(value)"></column-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('columnSelect');
    });

    afterEach(function () {
        $compile = null;
        scope = null;
        delimitedManagerSvc = null;
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        spyOn(this.controller, 'getValuePreview').and.returnValue('Preview');
        delimitedManagerSvc.getHeader.and.returnValue('Header');
        this.controller.selectedColumn = '0';
        this.controller.$onInit();
        expect(this.controller.columns).toEqual([{num: '0', header: 'Header'}]);
    });
    describe('controller bound variable', function() {
        it('selectedColumn should be one way bound', function() {
            this.controller.selectedColumn = '0';
            scope.$digest();
            expect(scope.selectedColumn).toEqual('');
        });
        it('changeEvent is called in the parent scope', function() {
            this.controller.changeEvent({value: '0'});
            expect(scope.changeEvent).toHaveBeenCalledWith('0');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('COLUMN-SELECT');
            expect(this.element.querySelectorAll('.column-select').length).toEqual(1);
        });
        it('with a column select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
        it('with a .form-text', function() {
            expect(this.element.querySelectorAll('.form-text').length).toEqual(1);
        });
        it('depending on whether a column is selected', function() {
            expect(this.element.querySelectorAll('.value-preview').length).toEqual(0);

            this.controller.selectedColumn = '0';
            console.log(angular.isNumber('0'));
            scope.$digest();
            expect(this.element.querySelectorAll('.value-preview').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('should test whether the header for a column matches', function() {
            [{searchText: 'a', result: true}, {searchText: 'A', result: true}, {searchText: 'b', result: false}]
                .forEach(test => {
                    expect(this.controller.compare({num: '0', header: 'a'}, test.searchText)).toEqual(test.result);
                });
        });
        it('should get a preview of a column value', function() {
            delimitedManagerSvc.dataRows = [['first'], ['second']];
            expect(this.controller.getValuePreview('0')).toEqual('second');
            delimitedManagerSvc.containsHeaders = false;
            expect(this.controller.getValuePreview('0')).toEqual('first');
        });
        it('should update the selectedColumn', function() {
            spyOn(this.controller, 'getValuePreview').and.returnValue('Preview');
            this.controller.onChange();
            expect(this.controller.preview).toEqual('(None)');
            expect(scope.changeEvent).toHaveBeenCalledWith('');

            this.controller.selectedColumn = '0';
            this.controller.onChange();
            expect(this.controller.preview).toEqual('Preview');
            expect(scope.changeEvent).toHaveBeenCalledWith('0');
        });
    });
});