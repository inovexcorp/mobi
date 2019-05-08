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
describe('Statement Display component', function() {
    var $compile, scope, splitIRI;

    beforeEach(function() {
        module('templates');
        module('shared');
        injectSplitIRIFilter();
        injectPrefixationFilter();

        inject(function(_$compile_, _$rootScope_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            splitIRI = _splitIRIFilter_;
        });
    });

    beforeEach(function compile() {
        this.compile = function(object, splitResult) {
            if (object === undefined || object === null) {
                object = 'object';
            }
            if (splitResult === undefined || splitResult === null) {
                splitResult = {};
            }
            scope.predicate = 'predicate';
            scope.object = object;
            var parent = $compile('<div></div>')(scope);
            parent.data('$statementContainerController', {});
            this.element = angular.element('<statement-display predicate="predicate" object="object"></statement-display>');
            parent.append(this.element);
            this.element = $compile(this.element)(scope);
            splitIRI.and.returnValue(splitResult);
            scope.$digest();
            this.controller = this.element.controller('statementDisplay');
        }

        this.compile();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('predicate should be one way bound', function() {
            this.controller.predicate = 'different';
            scope.$apply();
            expect(scope.predicate).toEqual('predicate');
        });
        it('object should be one way bound', function() {
            this.controller.object = 'different';
            scope.$apply();
            expect(scope.object).toEqual('object');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('STATEMENT-DISPLAY');
            expect(this.element.querySelectorAll('.statement-display').length).toEqual(1);
        });
        it('with .statement-cells', function() {
            expect(this.element.querySelectorAll('.statement-cell').length).toEqual(2);
        });
    });
    describe('check controller.o value', function() {
        describe('when @id is present', function() {
            it('and split.end is present', function() {
                this.compile({'@id': 'full/id'}, {end: 'id'});
                expect(splitIRI).toHaveBeenCalledWith('full/id');
                expect(this.controller.o).toEqual('id');
                expect(this.controller.fullObject).toEqual('full/id');
            });
            it('and split.end is empty', function() {
                this.compile({'@id': 'full/id'}, {end: ''});
                expect(splitIRI).toHaveBeenCalledWith('full/id');
                expect(this.controller.o).toEqual('full/id');
                expect(this.controller.fullObject).toEqual('full/id');
            });
        });
        it('when @value is present', function() {
            this.compile({'@value': 'value'});
            expect(this.controller.o).toEqual('value');
            expect(this.controller.fullObject).toEqual('value');
        });
        it('when @language is present', function() {
            this.compile({'@value': 'value', '@language': 'en'});
            expect(this.controller.o).toEqual('value [language: en]');
            expect(this.controller.fullObject).toEqual('value [language: en]');
        });
        it('when @type is present', function() {
            this.compile({'@value': 'value', '@type': 'type'});
            expect(this.controller.o).toEqual('value [type: type]');
            expect(this.controller.fullObject).toEqual('value [type: type]');
        });
        it('when no extra information is present', function() {
            this.compile('words');
            expect(this.controller.o).toEqual('words');
            expect(this.controller.fullObject).toEqual('words');
        });
    });
});