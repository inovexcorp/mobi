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
    var $compile, scope, utilSvc;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
        });

        scope.entity = {};
        this.element = $compile(angular.element('<entity-dates entity="entity"></entity-dates>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('entityDates');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('entity should be one way bound', function() {
            this.controller.entity = {a: 'b'};
            scope.$digest();
            expect(scope.entity).toEqual({});
        });
    });
    describe('controller methods', function() {
        it('should get the specified date of an entity by calling the proper functions', function() {
            var date = '1/1/2000';
            utilSvc.getDctermsValue.and.returnValue(date);
            utilSvc.getDate.and.returnValue(date);
            expect(this.controller.getDate('test')).toEqual(date);
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(scope.entity, 'test');
            expect(utilSvc.getDate).toHaveBeenCalledWith(date, 'short');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('ENTITY-DATES');
            expect(this.element.querySelectorAll('.entity-dates').length).toEqual(1);
        });
        it('with fields for issued and modified date', function() {
            var fields = this.element.querySelectorAll('span.date');
            expect(fields.length).toEqual(2);
            _.forEach(fields, field => {
                var f = angular.element(field);
                var text = f.text();
                expect(f.querySelectorAll('.field-name').length).toEqual(1);
                expect(_.includes(text, 'Issued') || _.includes(text, 'Modified')).toEqual(true);
            });
        });
    });
});