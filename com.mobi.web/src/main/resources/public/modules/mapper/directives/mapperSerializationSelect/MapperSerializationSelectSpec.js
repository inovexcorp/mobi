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
describe('Mapper Serialization Select directive', function() {
    var $compile,
        scope,
        mapperStateSvc,
        isolatedScope;

    beforeEach(function() {
        module('templates');
        module('mapperSerializationSelect');
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
        });

        scope.format = 'jsonld';
        this.element = $compile(angular.element('<mapper-serialization-select format="format"></mapper-serialization-select>'))(scope);
        scope.$digest();
    });

    describe('in insolated scope', function() {
        beforeEach(function() {
            isolatedScope = this.element.isolateScope();
        });
        it('format should be two way bound', function() {
            isolatedScope.format = 'test';
            scope.$digest();
            expect(scope.format).toBe('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SELECT');
            expect(this.element.hasClass('mapper-serialization-select')).toBe(true);
        });
        it('with the correct options', function() {
            var controller = this.element.controller('mapperSerializationSelect');
            var options = this.element.find('option');
            expect(options.length).toBe(controller.options.length);
            _.forEach(options, function(option) {
                var angularOption = angular.element(option);
                var optionObj = _.find(controller.options, {name: angularOption.text().trim()});
                expect(optionObj).toBeTruthy();
                expect(angularOption.attr('value')).toBe(optionObj.value);
            });
        });
    });
});