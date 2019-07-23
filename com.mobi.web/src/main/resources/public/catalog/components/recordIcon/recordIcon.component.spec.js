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
describe('Record Icon component', function() {
    var $compile, scope, catalogStateSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogState();

        inject(function(_$compile_, _$rootScope_, _catalogStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogStateSvc = _catalogStateService_;
        });

        catalogStateSvc.getRecordIcon.and.returnValue('fa-book');

        scope.record = {};
        this.element = $compile(angular.element('<record-icon record="record"></record-icon>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordIcon');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogStateSvc = null;
        this.element.remove();
    });

    describe('should initialize', function() {
        it('with the icon of the record', function() {
            expect(catalogStateSvc.getRecordIcon).toHaveBeenCalledWith(scope.record);
            expect(this.controller.icon).toEqual('fa-book');
        });
    });
    describe('controller bound variable', function() {
        it('record is one way bound', function() {
            this.controller.record = {test: true};
            scope.$digest();
            expect(scope.record).toEqual({});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('RECORD-ICON');
        });
        it('with a square icon', function() {
            expect(this.element.querySelectorAll('.fa-square').length).toBe(1);
        });
        it('with an icon for the record', function() {
            expect(this.element.querySelectorAll('.fa-book').length).toBe(1);
        });
    });
});