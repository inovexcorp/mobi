/*-
 * #%L
 * org.matonto.web
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
    var $compile, scope, element, isolatedScope;

    beforeEach(function() {
        module('templates');
        module('statementDisplay');
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.subject = 'subject';
        scope.predicate = 'predicate';
        scope.object = 'object';
        var parent = $compile('<div></div>')(scope);
        parent.data('$statementContainerController', {});
        element = angular.element('<statement-display subject="subject" predicate="predicate" object="object"></statement-display>');
        parent.append(element);
        element = $compile(element)(scope);
        scope.$digest();
    });

    describe('scope bound variables', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('subject should be one way bound', function() {
            isolatedScope.subject = 'different';
            scope.$apply();
            expect(scope.subject).toEqual('subject');
        });
        it('predicate should be one way bound', function() {
            isolatedScope.predicate = 'different';
            scope.$apply();
            expect(scope.predicate).toEqual('predicate');
        });
        it('object should be one way bound', function() {
            isolatedScope.object = 'different';
            scope.$apply();
            expect(scope.object).toEqual('object');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('TR');
            expect(element.hasClass('statement-display')).toBe(true);
        });
        it('with tds', function() {
            expect(element.find('td').length).toBe(3);
        });
    });
    describe('check addition attribute', function() {
        it('when present', function() {
            var parent = $compile('<div></div>')(scope);
            parent.data('$statementContainerController', {});
            element = angular.element('<statement-display subject="subject" predicate="predicate" object="object" addition></statement-display>');
            parent.append(element);
            element = $compile(element)(scope);
            scope.$digest();
            expect(element.isolateScope().isAddition).toBe(true);
            expect(element.hasClass('addition')).toBe(true);
        });
        it('when missing', function() {
            expect(element.isolateScope().isAddition).toBe(false);
            expect(element.hasClass('addition')).toBe(false);
        });
    });
    describe('check deletion attribute', function() {
        it('when present', function() {
            var parent = $compile('<div></div>')(scope);
            parent.data('$statementContainerController', {});
            element = angular.element('<statement-display subject="subject" predicate="predicate" object="object" deletion></statement-display>');
            parent.append(element);
            element = $compile(element)(scope);
            scope.$digest();
            expect(element.isolateScope().isDeletion).toBe(true);
            expect(element.hasClass('deletion')).toBe(true);
        });
        it('when missing', function() {
            expect(element.isolateScope().isDeletion).toBe(false);
            expect(element.hasClass('deletion')).toBe(false);
        });
    });
    describe('check controller.o value', function() {
        it('when @id is present', function() {
            scope.object = {'@id': 'id'};
            var parent = $compile('<div></div>')(scope);
            parent.data('$statementContainerController', {});
            element = angular.element('<statement-display subject="subject" predicate="predicate" object="object" deletion></statement-display>');
            parent.append(element);
            element = $compile(element)(scope);
            scope.$digest();
            expect(element.controller('statementDisplay').o).toBe('id');
        });
        it('when @value is present', function() {
            scope.object = {'@value': 'value'};
            var parent = $compile('<div></div>')(scope);
            parent.data('$statementContainerController', {});
            element = angular.element('<statement-display subject="subject" predicate="predicate" object="object" deletion></statement-display>');
            parent.append(element);
            element = $compile(element)(scope);
            scope.$digest();
            expect(element.controller('statementDisplay').o).toBe('value');
        });
        it('when @language is present', function() {
            scope.object = {'@value': 'value', '@language': 'en'};
            var parent = $compile('<div></div>')(scope);
            parent.data('$statementContainerController', {});
            element = angular.element('<statement-display subject="subject" predicate="predicate" object="object" deletion></statement-display>');
            parent.append(element);
            element = $compile(element)(scope);
            scope.$digest();
            expect(element.controller('statementDisplay').o).toBe('value [language: en]');
        });
        it('when none of the above are present', function() {
            scope.object = 'words';
            var parent = $compile('<div></div>')(scope);
            parent.data('$statementContainerController', {});
            element = angular.element('<statement-display subject="subject" predicate="predicate" object="object" deletion></statement-display>');
            parent.append(element);
            element = $compile(element)(scope);
            scope.$digest();
            expect(element.controller('statementDisplay').o).toBe('words');
        });
    });
});