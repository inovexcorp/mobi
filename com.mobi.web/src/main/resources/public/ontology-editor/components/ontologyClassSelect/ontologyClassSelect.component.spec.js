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
import {
    mockOntologyState,
    mockUtil,
    mockOntologyUtilsManager,
    injectTrustedFilter,
    injectHighlightFilter
} from '../../../../../../test/js/Shared';

describe('Ontology Class Select component', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
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

        scope.bindModel = [];
        scope.lockChoice = jasmine.createSpy('lockChoice');
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<ontology-class-select bind-model="bindModel" lock-choice="lockChoice(iri)" change-event="changeEvent(values)"></ontology-class-select>'))(scope);
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
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = ['different'];
            scope.$apply();
            expect(scope.bindModel).toEqual([]);
        });
        it('lockChoice should be called in parent scope', function() {
            this.controller.lockChoice({iri: 'iri'});
            expect(scope.lockChoice).toHaveBeenCalledWith('iri');
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({values: []});
            expect(scope.changeEvent).toHaveBeenCalledWith([]);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('ONTOLOGY-CLASS-SELECT');
            expect(this.element.querySelectorAll('.ontology-class-select').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        _.forEach(['custom-label', 'ui-select', 'ui-select-match', 'ui-select-choices'], el => {
            it('with a ' + el, function() {
                expect(this.element.find(el).length).toEqual(1);
            });
        });
        _.forEach(['span[title]', 'div[title]'], sel => {
            it('with a ' + sel, function() {
                expect(this.element.querySelectorAll(sel).length).toEqual(1);
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
        it('onChange should call changeEvent', function() {
            this.controller.onChange();
            expect(scope.changeEvent).toHaveBeenCalledWith([]);
        });
    });
});