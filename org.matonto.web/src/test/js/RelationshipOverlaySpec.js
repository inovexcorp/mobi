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
describe('Relationship Overlay directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, propertyManagerSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('relationshipOverlay');
        mockResponseObj();
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyManagerService_,
            _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            resObj = _responseObj_;
            ontologyManagerSvc = _ontologyManagerService_;
            splitIRIFilter = _splitIRIFilter_;
        });

        scope.relationshipList = [];

        element = $compile(angular.element('<relationship-overlay relationship-list="relationshipList"></relationship-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('relationshipOverlay');
    });

    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on relationship-overlay', function() {
            expect(element.hasClass('relationship-overlay')).toBe(true);
        });
        it('based on form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('based on h6', function() {
            expect(element.find('h6').length).toBe(1);
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
        it('based on .btn', function() {
            expect(element.querySelectorAll('.btn').length).toBe(2);
        });
    });
    describe('controller methods', function() {
        it('addRelationship should call the appropriate manager functions', function() {
            controller.addRelationship();
            expect(ontologyManagerSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                jasmine.any(Object));
            expect(ontologyStateSvc.showRelationshipOverlay).toBe(false);
        });
        it('getIRINamespace should return the proper value', function() {
            var item = {};
            var result = controller.getIRINamespace(item);
            expect(splitIRIFilter).toHaveBeenCalledWith(item);
            expect(result).toEqual(splitIRIFilter(item).begin + splitIRIFilter(item).then);
        });
    });
});