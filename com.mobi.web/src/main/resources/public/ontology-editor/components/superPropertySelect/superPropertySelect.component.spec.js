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

describe('Super Property Select component', function() {
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
        scope.key = 'key';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<super-property-select bindModel="bindModel" key="key" change-event="changeEvent(values)"></super-property-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('superPropertySelect');
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
        it('key should be one way bound', function() {
            this.controller.key = 'new';
            scope.$digest();
            expect(scope.key).toEqual('key');
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({values: []});
            expect(scope.changeEvent).toHaveBeenCalledWith([]);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SUPER-PROPERTY-SELECT');
            expect(this.element.querySelectorAll('.super-property-select').length).toEqual(1);
            expect(this.element.querySelectorAll('.advanced-language-select').length).toEqual(1);
        });
        it('for correct links', function() {
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toEqual(1);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toEqual(0);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toEqual(1);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('custom-label').length).toEqual(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('ui-select').length).toEqual(1);
        });
        it('with a ui-select-match', function() {
            expect(this.element.find('ui-select-match').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('ui-select-match').length).toEqual(1);
        });
        it('with a span[title]', function() {
            expect(this.element.querySelectorAll('span[title]').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('span[title]').length).toEqual(1);
        });
        it('with a ui-select-choices', function() {
            expect(this.element.find('ui-select-choices').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('ui-select-choices').length).toEqual(1);
        });
        it('with a div[title]', function() {
            expect(this.element.querySelectorAll('div[title]').length).toEqual(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('div[title]').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            this.controller.show();
            expect(this.controller.isShown).toEqual(true);
        });
        it('hide sets the proper variables', function() {
            this.controller.hide();
            expect(this.controller.isShown).toEqual(false);
            expect(scope.changeEvent).toHaveBeenCalledWith([]);
        });
        it('getValues should call the correct method', function() {
            ontologyStateSvc.listItem = { key: { iris: {iri: 'ontologyId'} } };
            ontoUtils.getSelectList.and.returnValue(['list']);
            this.controller.getValues('text');
            expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['iri'], 'text', ontoUtils.getDropDownText);
            expect(this.controller.array).toEqual(['list']);
        });
        it('onChange should call changeEvent', function() {
            this.controller.bindModel = [];
            this.controller.onChange();
            expect(scope.changeEvent).toHaveBeenCalledWith([]);
        });
    });
});