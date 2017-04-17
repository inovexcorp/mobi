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
        $filter,
        element,
        controller,
        isolatedScope,
        ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('staticIri');
        injectSplitIRIFilter();
        injectRegexConstant();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$filter_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $filter = _$filter_;
            ontologyStateSvc = _ontologyStateService_;
        });

        scope.onEdit = jasmine.createSpy('onEdit');
        scope.iri = 'iri';
        element = $compile(angular.element('<static-iri on-edit="onEdit()" iri="iri"></static-iri>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('onEdit should be called in parent scope', function() {
            isolatedScope.onEdit();
            scope.$digest();
            expect(scope.onEdit).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        beforeEach(function() {
            controller = element.controller('staticIri');
        });
        it('iri should be two way bound', function() {
            controller.iri = 'new';
            scope.$digest();
            expect(scope.iri).toBe('new');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            ontologyStateSvc.showIriOverlay = true;
            scope.$digest();
        });
        it('for wrapping containers STATIC-IRI', function() {
            expect(element.prop('tagName')).toBe('STATIC-IRI');
            expect(element.querySelectorAll('.static-iri').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('depending on whether the iri overlay should be shown', function() {
            expect(element.querySelectorAll('.overlay').length).toBe(1);

            ontologyStateSvc.showIriOverlay = false;
            scope.$digest();
            expect(element.querySelectorAll('.overlay').length).toBe(0);
        });
        it('depending on whether the begin field is invalid', function() {
            var beginContainer = angular.element(element.querySelectorAll('.overlay .begin-container')[0]);
            expect(beginContainer.hasClass('has-error')).toBe(false);

            controller = element.controller('staticIri');
            controller.iriForm = {
                iriBegin: {
                    '$error': {
                        pattern: true
                    }
                }
            };
            scope.$digest();
            expect(beginContainer.hasClass('has-error')).toBe(true);
        });
        it('depending on whether the ends field is invalid', function() {
            var endsContainer = angular.element(element.querySelectorAll('.overlay .ends-container')[0]);
            expect(endsContainer.hasClass('has-error')).toBe(false);

            controller = element.controller('staticIri');
            controller.iriForm = {
                iriEnd: {
                    '$error': {
                        pattern: true
                    }
                }
            };
            scope.$digest();
            expect(endsContainer.hasClass('has-error')).toBe(true);
        });
        it('depending on the form validity', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary.pull-right')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller = element.controller('staticIri');
            controller.iriForm.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.ontology[0].matonto.iriBegin = 'begin';
            ontologyStateSvc.listItem.ontology[0].matonto.iriThen = 'then';
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
        it('check $watch', function() {
            controller.setVariables = jasmine.createSpy('setVariables');
            controller.iri = 'new';
            scope.$digest();
            expect(controller.setVariables).toHaveBeenCalled();
        });
    });
});
