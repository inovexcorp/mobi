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
describe('Static IRI directive', function() {
    var $compile,
        scope,
        element;

    injectRegexConstant();
    injectSplitIRIFilter();

    beforeEach(function() {
        module('staticIri');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/staticIri/staticIri.html');

    beforeEach(function() {
        scope.onEdit = jasmine.createSpy('onEdit');
        scope.iri = 'iri';
        scope.ontologyIriBegin = 'begin';
        scope.ontologyIriThen = 'then';

        element = $compile(angular.element('<static-iri on-edit="onEdit()" iri="iri" ontology-iri-begin="ontologyIriBegin" ontology-iri-then="ontologyIriThen"></static-iri>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        var isolatedScope;
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('selectItem should be called in parent scope', function() {
            isolatedScope.onEdit();
            scope.$digest();
            expect(scope.onEdit).toHaveBeenCalled();
        });
    });
    describe('controller bound variables', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('staticIri');
        });
        it('iri should be two way bound', function() {
            controller.iri = 'new';
            scope.$digest();
            expect(scope.iri).toBe('new');
        });
        it('ontologyIriBegin should be two way bound', function() {
            controller.ontologyIriBegin = 'new';
            scope.$digest();
            expect(scope.ontologyIriBegin).toBe('new');
        });
        it('ontologyIriThen should be two way bound', function() {
            controller.ontologyIriThen = 'new';
            scope.$digest();
            expect(scope.ontologyIriThen).toBe('new');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element.controller('staticIri').showIriOverlay = true;
            scope.$digest();
        });
        it('for a STATIC-IRI', function() {
            expect(element.prop('tagName')).toBe('STATIC-IRI');
        });
        it('based on .static-iri', function() {
            var items = element.querySelectorAll('.static-iri');
            expect(items.length).toBe(1);
        });
        it('based on h6', function() {
            var items = element.querySelectorAll('h6');
            expect(items.length).toBe(1);
        });
        it('based on form', function() {
            var items = element.querySelectorAll('form');
            expect(items.length).toBe(1);
        });
        it('based on .btn-container', function() {
            var items = element.querySelectorAll('.btn-container');
            expect(items.length).toBe(1);
        });
    });
    describe('controller methods', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('staticIri');
        });
        it('setVariables changes the passed in variable', function() {
            var obj = {
                iriBegin: 'begin',
                iriThen: 'then',
                iriEnd: 'end'
            }
            controller.setVariables(obj);
            expect(obj.iriBegin).toBe('');
            expect(obj.iriThen).toBe('');
            expect(obj.iriEnd).toBe('');
        });
        it('resetVariables updates iriBegin, iriThen, and iriEnd', function() {
            controller.refresh = {
                iriBegin: 'new',
                iriThen: 'new',
                iriEnd: 'new'
            }
            controller.resetVariables();
            expect(controller.iriBegin).toBe('new');
            expect(controller.iriThen).toBe('new');
            expect(controller.iriEnd).toBe('new');
        });
        it('afterEdit update ontologyIriBegin and ontologyIriThen and sets showIriOverlay to false', function() {
            controller.showIriOverlay = true;
            controller.iriBegin = 'new';
            controller.iriThen = 'new';
            controller.afterEdit();
            expect(controller.ontologyIriBegin).toBe('new');
            expect(controller.ontologyIriThen).toBe('new');
            expect(controller.showIriOverlay).toBe(false);
        });
        it('check $watch', function() {
            controller.setVariables = jasmine.createSpy('setVariables');
            controller.iri = 'new';
            scope.$digest();
            expect(controller.setVariables).toHaveBeenCalled();
        });
    });
});
