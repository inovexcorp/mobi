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
describe('Mapper Serialization Select component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('mapper');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.format = 'jsonld';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.required = '';
        scope.name = '';
        var form = $compile('<form></form>')(scope);
        this.element = $compile(angular.element('<mapper-serialization-select format="format" change-event="changeEvent(value)" required="required" name="name"></mapper-serialization-select>'))(scope);
        form.append(this.element);
        this.element = $compile(this.element)(scope);
        scope.$digest();
        this.controller = this.element.controller('mapperSerializationSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('format should be one way bound', function() {
            var original = scope.format;
            this.controller.format = 'test';
            scope.$digest();
            expect(scope.format).toEqual(original);
        });
        it('required should be one way bound', function() {
            this.controller.required = 'required';
            scope.$digest();
            expect(scope.required).toEqual('');
        });
        it('name should be one way bound', function() {
            this.controller.name = 'test';
            scope.$digest();
            expect(scope.name).toEqual('');
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: 'test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MAPPER-SERIALIZATION-SELECT');
            expect(this.element.querySelectorAll('.mapper-serialization-select').length).toEqual(1);
            expect(this.element.find('select').length).toEqual(1);
        });
        it('depending on the required value', function() {
            var select = this.element.find('select');
            expect(select.attr('required')).toBeTruthy();
            
            this.controller.isRequired = false;
            scope.$digest();
            expect(select.attr('required')).toBeFalsy();
        });
        it('with the correct classes select field', function() {
            this.controller.name = 'test';
            this.controller.isRequired = false;
            scope.$digest();
            var select = this.element.find('select');
            expect(select.hasClass('is-invalid')).toEqual(false);

            this.controller.form.test.$invalid = true;
            scope.$digest();
            expect(select.hasClass('is-invalid')).toEqual(true);
        });
        it('with the correct options', function() {
            var options = this.element.find('option');
            expect(options.length).toEqual(this.controller.options.length);
            _.toArray(options).forEach(option => {
                var angularOption = angular.element(option);
                var optionObj = _.find(this.controller.options, {name: angularOption.text().trim()});
                expect(optionObj).toBeTruthy();
                expect(angularOption.attr('value')).toEqual(optionObj.value);
            });
        });
    });
});