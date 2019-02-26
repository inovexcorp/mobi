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
describe('IRI Select component', function() {
    var $compile, scope, utilSvc;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'customLabel');
        mockUtil();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
        });

        scope.bindModel = undefined;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.displayText = 'test';
        scope.selectList = {};
        scope.mutedText = 'test';
        scope.isDisabledWhen = false;
        scope.isRequiredWhen = false;
        this.element = $compile(angular.element('<iri-select multi-select="multiSelect" on-change="onChange()" display-text="displayText" select-list="selectList" muted-text="mutedText" ng-model="bindModel" is-disabled-when="isDisabledWhen" multi-select="multiSelect"></iri-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('iriSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        this.element.remove();
    });

    beforeEach(function compile() {
        this.compile = function(html) {
            if (!html) {
                html = '<iri-select change-event="changeEvent(value)" display-text="displayText" select-list="selectList" muted-text="mutedText" bind-model="bindModel" is-disabled-when="isDisabledWhen"></iri-select>';
            }
            this.element = $compile(angular.element(html))(scope);
            scope.$digest();
            this.controller = this.element.controller('iriSelect');
        };
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            this.compile();
        });
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'new';
            scope.$digest();
            expect(scope.bindModel).toEqual(undefined);
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
        it('mutedText should be one way bound', function() {
            this.controller.mutedText = 'new';
            scope.$digest();
            expect(scope.mutedText).toEqual('test');
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: 'test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('test');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('IRI-SELECT');
            expect(this.element.querySelectorAll('.iri-select').length).toBe(1);
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('depending on whether it is a multi select', function() {
            var selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeUndefined();

            this.compile('<iri-select multi-select></iri-select>');
            scope.$digest();
            selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeDefined();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.selectList = {iri: 'new'};
            this.compile();
        });
        it('getOntologyIri should return the set ontology IRI from the selectList if provided', function() {
            expect(this.controller.getOntologyIri('iri')).toEqual('new');
        });
        it('getValues should set the correct value', function() {
            this.controller.selectList = {iri: 'new'};
            utilSvc.getBeautifulIRI.and.returnValue('new');
            this.controller.getValues('ne');
            expect(this.controller.values).toEqual(['iri']);
        });
    });
});