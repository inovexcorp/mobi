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
describe('Upload Ontology Tab directive', function() {
    var $compile;
    var scope;
    var element;
    var controller;
    var ontologyStateSvc;
    var ontologyManagerSvc;
    var prefixes;

    beforeEach(function() {
        module('templates');
        module('uploadOntologyTab');
        mockOntologyManager();
        mockOntologyState();
        mockPrefixes();
        injectRegexConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            prefixes = _prefixes_;
        });

        element = $compile(angular.element('<upload-ontology-tab></upload-ontology-tab>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on upload-ontology-tab', function() {
            expect(element.hasClass('upload-ontology-tab')).toBe(true);
        });
        it('based on .actions div', function() {
            expect(element.querySelectorAll('.actions').length).toBe(1);
        });
        it('based on .form-container div', function() {
            expect(element.querySelectorAll('.form-container').length).toBe(1);
        });
        it('based on form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('based on .btn-container div', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
    });
    describe('controller methods', function() {

    });
});
