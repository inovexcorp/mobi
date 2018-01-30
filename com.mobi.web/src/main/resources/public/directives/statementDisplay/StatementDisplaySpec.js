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
describe('Statement Display directive', function() {
    var $compile, scope, splitIRI;

    beforeEach(function() {
        module('templates');
        module('statementDisplay');
        injectSplitIRIFilter();
        injectPrefixationFilter();

        inject(function(_$compile_, _$rootScope_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            splitIRI = _splitIRIFilter_;
        });
    });

    beforeEach(function compile() {
        this.compile = function(html, object, splitResult) {
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
            this.element = angular.element(html);
            parent.append(this.element);
            this.element = $compile(this.element)(scope);
            splitIRI.and.returnValue(splitResult);
            scope.$digest();
            this.isolatedScope = this.element.isolateScope();
            this.controller = this.element.controller('statementDisplay');
        }

        this.compile('<statement-display predicate="predicate" object="object"></statement-display>');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('predicate should be one way bound', function() {
            this.isolatedScope.predicate = 'different';
            scope.$apply();
            expect(scope.predicate).toEqual('predicate');
        });
        it('object should be one way bound', function() {
            this.isolatedScope.object = 'different';
            scope.$apply();
            expect(scope.object).toEqual('object');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('TR');
            expect(this.element.hasClass('statement-display')).toBe(true);
        });
        it('with tds', function() {
            expect(this.element.find('td').length).toBe(3);
        });
    });
    describe('check addition attribute', function() {
        it('when present', function() {
            this.compile('<statement-display predicate="predicate" object="object" addition></statement-display>');
            expect(this.isolatedScope.isAddition).toBe(true);
            expect(this.element.hasClass('addition')).toBe(true);
        });
        it('when missing', function() {
            expect(this.isolatedScope.isAddition).toBe(false);
            expect(this.element.hasClass('addition')).toBe(false);
        });
    });
    describe('check deletion attribute', function() {
        it('when present', function() {
            this.compile('<statement-display predicate="predicate" object="object" deletion></statement-display>');
            expect(this.isolatedScope.isDeletion).toBe(true);
            expect(this.element.hasClass('deletion')).toBe(true);
        });
        it('when missing', function() {
            expect(this.isolatedScope.isDeletion).toBe(false);
            expect(this.element.hasClass('deletion')).toBe(false);
        });
    });
    describe('check controller.o value', function() {
        describe('when @id is present', function() {
            it('and split.end is present', function() {
                this.compile('<statement-display predicate="predicate" object="object" deletion></statement-display>', {'@id': 'full/id'}, {end: 'id'});
                expect(splitIRI).toHaveBeenCalledWith('full/id');
                expect(this.controller.o).toBe('id');
                expect(this.controller.fullObject).toBe('full/id');
            });
            it('and split.end is empty', function() {
                this.compile('<statement-display predicate="predicate" object="object" deletion></statement-display>', {'@id': 'full/id'}, {end: ''});
                expect(splitIRI).toHaveBeenCalledWith('full/id');
                expect(this.controller.o).toBe('full/id');
                expect(this.controller.fullObject).toBe('full/id');
            });
        });
        it('when @value is present', function() {
            this.compile('<statement-display predicate="predicate" object="object" deletion></statement-display>', {'@value': 'value'});
            expect(this.controller.o).toBe('value');
            expect(this.controller.fullObject).toBe('value');
        });
        it('when @language is present', function() {
            this.compile('<statement-display predicate="predicate" object="object" deletion></statement-display>', {'@value': 'value', '@language': 'en'});
            expect(this.controller.o).toBe('value [language: en]');
            expect(this.controller.fullObject).toBe('value [language: en]');
        });
        it('when @type is present', function() {
            this.compile('<statement-display predicate="predicate" object="object" deletion></statement-display>', {'@value': 'value', '@type': 'type'});
            expect(this.controller.o).toBe('value [type: type]');
            expect(this.controller.fullObject).toBe('value [type: type]');
        });
        it('when none of the above are present', function() {
            this.compile('<statement-display predicate="predicate" object="object" deletion></statement-display>', 'words');
            expect(this.controller.o).toBe('words');
            expect(this.controller.fullObject).toBe('words');
        });
    });
});