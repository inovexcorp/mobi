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
    mockOntologyUtilsManager,
    injectTrustedFilter,
    injectHighlightFilter
} from '../../../../../../test/js/Shared';

describe('IRI Select Ontology component', function() {
    var $compile, scope, ontologyStateSvc, ontoUtilsSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockOntologyState();
        mockOntologyUtilsManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtilsSvc = _ontologyUtilsManagerService_;
        });

        scope.displayText = 'test';
        scope.selectList = {};
        scope.mutedText = 'test';
        scope.isDisabledWhen = false;
        scope.isRequiredWhen = false;
        scope.multiSelect = true;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.bindModel = '';

        this.element = $compile(angular.element('<iri-select-ontology multi-select="multiSelect" change-event="changeEvent(value)" display-text="displayText" select-list="selectList" muted-text="mutedText" bind-model="bindModel" is-disabled-when="isDisabledWhen"></iri-select-ontology>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('iriSelectOntology');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtilsSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'new';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('selectList should be one way bound', function() {
            this.controller.selectList = {test: 'ontology'};
            scope.$digest();
            expect(scope.selectList).toEqual({});
        });
        it('displayText should be one way bound', function() {
            this.controller.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('test');
        });
        it('isDisabledWhen should be one way bound', function() {
            this.controller.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('isRequiredWhen should be one way bound', function() {
            this.controller.isRequiredWhen = true;
            scope.$digest();
            expect(scope.isRequiredWhen).toEqual(false);
        });
        it('multiSelect should be one way bound', function() {
            this.controller.multiSelect = false;
            scope.$digest();
            expect(scope.multiSelect).toEqual(true);
        });
        it('mutedText should be one way bound', function() {
            this.controller.mutedText = 'new';
            scope.$digest();
            expect(scope.mutedText).toEqual('test');
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: 'wow'});
            expect(scope.changeEvent).toHaveBeenCalledWith('wow');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('IRI-SELECT-ONTOLOGY');
            expect(this.element.querySelectorAll('.iri-select-ontology').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        it('with custom-labels', function() {
            expect(this.element.querySelectorAll('custom-label').length).toEqual(1);
        });
        it('depending on whether it is a multi select', function() {
            var selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toEqual(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeDefined();

            scope.multiSelect = false;
            scope.$digest();
            selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toEqual(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeUndefined();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.ontologyId = 'ontologyId';
            this.controller.selectList = {iri: 'new'};
        });
        describe('getOntologyIri', function() {
            it('should return ontologyId if nothing is passed in', function() {
                expect(this.controller.getOntologyIri()).toEqual('ontologyId');
            });
            it('should return the set ontology IRI from the selectList if provided', function() {
                expect(this.controller.getOntologyIri('iri')).toEqual('new');
            });
            it('should return ontologyId if iri is not set on selectList', function() {
                expect(this.controller.getOntologyIri('test')).toEqual('ontologyId');
            });
        });
        it('onChange should call changeEvent', function() {
            this.controller.onChange();
            expect(scope.changeEvent).toHaveBeenCalledWith(this.controller.bindModel);
        });
        it('getValues should set the correct value', function() {
            scope.selectList = {iri: 'new'};
            ontoUtilsSvc.getSelectList.and.returnValue(['item']);
            this.controller.getValues('text');
            expect(ontoUtilsSvc.getSelectList).toHaveBeenCalledWith(['iri'], 'text', ontoUtilsSvc.getDropDownText);
            expect(this.controller.values).toEqual(['item']);
        });
    });
});