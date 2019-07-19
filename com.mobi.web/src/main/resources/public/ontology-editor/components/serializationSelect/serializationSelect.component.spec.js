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
describe('Serialization Select component', function() {
    var $compile, scope;

    beforeEach(function() {
        angular.mock.module('ontology-editor');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<serialization-select bind-model="bindModel" change-event="changeEvent(value)"></serialization-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('serializationSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'turtle';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: 'test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SERIALIZATION-SELECT');
            expect(this.element.querySelectorAll('.serialization-select').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        it('with a select', function() {
            expect(this.element.find('select').length).toEqual(1);
        });
        it('with options', function() {
            expect(this.element.find('option').length).toEqual(4);
        });
    });
});