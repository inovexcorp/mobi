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
describe('Ontology Class Select directive', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('ontologyClassSelect');
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        scope.values = [];
        scope.lockChoice = jasmine.createSpy('lockChoice');
        this.element = $compile(angular.element('<ontology-class-select values="values" lock-choice="lockChoice(iri)"></ontology-class-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyClassSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('values should be two way bound', function() {
            this.controller.values = ['different'];
            scope.$apply();
            expect(scope.values).toEqual(['different']);
        });
        it('lockChoice should be called in parent scope', function() {
            this.controller.lockChoice({iri: 'iri'});
            expect(scope.lockChoice).toHaveBeenCalledWith('iri');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-class-select')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        _.forEach(['custom-label', 'ui-select', 'ui-select-match', 'ui-select-choices'], el => {
            it('with a ' + el, function() {
                expect(this.element.find(el).length).toBe(1);
            });
        });
        _.forEach(['span[title]', 'div[title]'], sel => {
            it('with a ' + sel, function() {
                expect(this.element.querySelectorAll(sel).length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        it('getValues should call the correct method', function() {
            ontologyStateSvc.listItem.classes.iris = { classA: 'ontologyId' };
            ontoUtils.getSelectList.and.returnValue(['list']);
            this.controller.getValues('text');
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['classA'], 'text', ontoUtils.getDropDownText);
            expect(this.controller.array).toEqual(['list']);
        });
    });
});