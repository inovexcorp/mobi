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
describe('Axiom Overlay directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, propertyManagerSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('axiomOverlay');
        mockResponseObj();
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        injectRegexConstant();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            resObj = _responseObj_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        scope.axiomList = [];
        scope.onSubmit = jasmine.createSpy('onSubmit');

        element = $compile(angular.element('<axiom-overlay axiom-list="axiomList" on-submit="onSubmit()"></axiom-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('axiomOverlay');
    });

    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('based on .form-groups', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('based on custom-label', function() {
            expect(element.find('custom-label').length).toBe(2);
        });
        it('based on ui-select', function() {
            expect(element.find('ui-select').length).toBe(2);
        });
        it('based on .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('addAxiom should call the appropriate manager functions', function() {
            controller.addAxiom();
            expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyId,
                jasmine.any(Object));
            expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
        });
    });
});