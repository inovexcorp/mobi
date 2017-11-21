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
describe('Record Type directive', function() {
    var $compile, scope, catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('recordType');
        mockCatalogManager();
        injectSplitIRIFilter();
        injectChromaConstant();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
        });

        catalogManagerSvc.recordTypes = ['type'];
        scope.type = '';
        this.element = $compile(angular.element('<record-type type="type"></record-type>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordType');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('type should be one way bound', function() {
            this.isolatedScope.type = 'test';
            scope.$digest();
            expect(scope.type).toEqual('');
        });
    });
    describe('controller methods', function() {
        it('should get the color for a type', function() {
            var result = this.controller.getColor('type');
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('record-type')).toBe(true);
            expect(this.element.hasClass('label')).toBe(true);
        });
        it('with the correct background color depending on the record type', function() {
            spyOn(this.controller, 'getColor').and.returnValue('white');
            scope.$digest();
            expect(this.element.css('background-color')).toBe('white');
        });
    });
});