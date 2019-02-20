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
describe('Entity Dates directive', function() {
    var $compile, scope, utilSvc, $filter;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _utilService_, _$filter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            $filter = _$filter_;
        });

        scope.entity = {};
        this.element = $compile(angular.element('<entity-dates entity="entity"></entity-dates>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('entityDates');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        $filter = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('entity should be one way bound', function() {
            this.isolatedScope.entity = {a: 'b'};
            scope.$digest();
            expect(scope.entity).toEqual({});
        });
    });
    describe('controller methods', function() {
        it('should get the specified date of an entity by calling the proper functions', function() {
            var date = '1/1/2000';
            utilSvc.getDctermsValue.and.returnValue(date);
            var result = this.controller.getDate({}, 'test');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({}, 'test');
            expect(utilSvc.getDate).toHaveBeenCalledWith(date, 'short');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('entity-dates')).toBe(true);
        });
        it('with fields for issued and modified date', function() {
            var fields = this.element.querySelectorAll('span.date');
            expect(fields.length).toBe(2);
            _.forEach(fields, function(field) {
                var f = angular.element(field);
                var text = f.text();
                expect(f.querySelectorAll('.field-name').length).toBe(1);
                expect(_.includes(text, 'Issued') || _.includes(text, 'Modified')).toBe(true);
            });
        });
    });
});