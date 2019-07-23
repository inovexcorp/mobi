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
describe('Block Search component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.clearEvent = jasmine.createSpy('clearEvent');
        scope.bindModel = '';
        var parent = $compile('<div></div>')(scope);
        parent.data('$blockController', {});
        this.element = angular.element('<block-search bind-model="bindModel" change-event="changeEvent(value)" clear-event="clearEvent()"></block-search>');
        parent.append(this.element);
        this.element = $compile(this.element)(scope);
        scope.$digest();
        this.controller = this.element.controller('blockSearch');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        })
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
        it('clearEvent should be called in parent scope', function() {
            this.controller.clearEvent();
            expect(scope.clearEvent).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('BLOCK-SEARCH');
            expect(this.element.querySelectorAll('.search').length).toEqual(1);
        });
        ['i', 'input', 'a'].forEach(test => {
            it('with an ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        ['.fa-search', '.fa-times-circle'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toEqual(1);
            });
        });
    });
    it('should call changeEvent when the text in the input changes', function() {
        var input = this.element.find('input')
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalledWith('Test');
    });
});