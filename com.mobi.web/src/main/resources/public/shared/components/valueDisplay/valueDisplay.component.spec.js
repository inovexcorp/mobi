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
describe('Value Display component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        injectPrefixationFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        mockUtil();
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.value = {'@id': 'new'};
        scope.highlightText = 'text';
        this.element = $compile(angular.element('<value-display value="value" highlight-text="highlightText"></value-display>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('valueDisplay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('value should be one way bound', function() {
            this.controller.value = {'@id': 'different'};
            scope.$digest();
            expect(scope.value).toEqual({'@id': 'new'});
        });
        it('highlightText should be one way bound', function() {
            this.controller.highlightText = 'new text';
            scope.$digest();
            expect(scope.highlightText).toEqual('text');
        });
    });
    describe('controller methods', function() {
        describe('has should return', function() {
            beforeEach(function() {
                this.obj = {prop: 'value'};
            });
            it('true when property is present', function() {
                expect(this.controller.has(this.obj, 'prop')).toEqual(true);
            });
            it('false when property is not present', function() {
                expect(this.controller.has(this.obj, 'missing')).toEqual(false);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('VALUE-DISPLAY');
            expect(this.element.querySelectorAll('.value-display').length).toEqual(1);
        });
        it('with a .has-id', function() {
            expect(this.element.querySelectorAll('.has-id').length).toEqual(1);

            this.controller.value = {};
            scope.$apply();

            expect(this.element.querySelectorAll('.has-id').length).toEqual(0);
        });
        it('with a .has-value', function() {
            expect(this.element.querySelectorAll('.has-value').length).toEqual(0);

            this.controller.value = {'@value': 'value'};
            scope.$apply();

            expect(this.element.querySelectorAll('.has-value').length).toEqual(1);
        });
        it('with a .text-muted.lang-display', function() {
            expect(this.element.querySelectorAll('.text-muted.lang-display').length).toEqual(0);

            this.controller.value = {'@value': 'value', '@language': 'en'};
            scope.$apply();

            expect(this.element.querySelectorAll('.text-muted.lang-display').length).toEqual(1);
        });
        it('with a .text-muted.type-display', function() {
            expect(this.element.querySelectorAll('.text-muted.type-display').length).toEqual(0);

            this.controller.value = {'@value': 'value', '@type': 'type'};
            scope.$apply();

            expect(this.element.querySelectorAll('.text-muted.type-display').length).toEqual(1);
        });
    });
});