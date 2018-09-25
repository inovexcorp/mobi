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
describe('IRI Select directive', function() {
    var $compile, scope, utilSvc;

    beforeEach(function() {
        module('templates');
        module('iriSelect');
        mockUtil();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
        });

        scope.displayText = 'test';
        scope.selectList = {};
        scope.mutedText = 'test';
        scope.isDisabledWhen = false;
        scope.isRequiredWhen = false;
        scope.multiSelect = false;
        scope.onChange = jasmine.createSpy('onChange');
        scope.bindModel = undefined;
        scope.defaultOntologyIri = 'ontologyId';

        this.element = $compile(angular.element('<iri-select multi-select="multiSelect" on-change="onChange()" display-text="displayText" select-list="selectList" muted-text="mutedText" ng-model="bindModel" is-disabled-when="isDisabledWhen" multi-select="multiSelect" default-ontology-id="defaultOntologyId"></iri-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('iriSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('displayText should be one way bound', function() {
            this.isolatedScope.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('test');
        });
        it('isDisabledWhen should be one way bound', function() {
            this.isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('isRequiredWhen should be one way bound', function() {
            this.isolatedScope.isRequiredWhen = true;
            scope.$digest();
            expect(scope.isRequiredWhen).toEqual(false);
        });
        it('multiSelect should be one way bound', function() {
            this.isolatedScope.multiSelect = true;
            scope.$digest();
            expect(scope.multiSelect).toEqual(false);
        });
        it('mutedText should be one way bound', function() {
            this.isolatedScope.mutedText = 'new';
            scope.$digest();
            expect(scope.mutedText).toEqual('test');
        });
        it('onChange should be called in parent scope', function() {
            this.isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'new';
            scope.$digest();
            expect(scope.bindModel).toEqual('new');
        });
        it('selectList should be one way bound', function() {
            this.controller.selectList = {test: 'ontology'};
            scope.$digest();
            expect(scope.selectList).toEqual({});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('iri-select')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with custom-labels', function() {
            expect(this.element.querySelectorAll('custom-label').length).toBe(1);
        });
        it('depending on whether it is a multi select', function() {
            var selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeUndefined();

            scope.multiSelect = true;
            scope.$digest();
            selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeDefined();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.controller.defaultOntologyIri = 'ontologyId';
            this.controller.selectList = {iri: 'new'};
        });
        describe('getOntologyIri', function() {
            it('should return the set ontology IRI from the selectList if provided', function() {
                expect(this.controller.getOntologyIri('iri')).toEqual('new');
            });
        });
        it('getValues should set the correct value', function() {
            scope.selectList = {iri: 'new'};
            utilSvc.getBeautifulIRI.and.returnValue('new');
            this.controller.getValues('ne');
            expect(this.controller.values).toEqual(['iri']);
        });
    });
});