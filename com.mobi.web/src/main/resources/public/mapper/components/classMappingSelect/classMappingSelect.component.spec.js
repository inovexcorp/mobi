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
describe('Class Mapping Select component', function() {
    var $compile, scope, utilSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        injectTrustedFilter();
        injectHighlightFilter();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
        });

        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.classMappings = [];
        this.element = $compile(angular.element('<class-mapping-select bind-model="bindModel" change-event="changeEvent(value)" class-mappings="classMappings"></class-mapping-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classMappingSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('classMappings should be one way bound', function() {
            this.controller.classMappings = [{}];
            scope.$digest();
            expect(scope.classMappings).toEqual([]);
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: 'test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('test');
        });
    });
    describe('controller methods', function() {
        it('should get the title of a class mapping', function() {
            utilSvc.getDctermsValue.and.returnValue('Title');
            expect(this.controller.getTitle({})).toEqual('Title');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({}, 'title');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CLASS-MAPPING-SELECT');
            expect(this.element.querySelectorAll('.class-mapping-select').length).toEqual(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
    });
});