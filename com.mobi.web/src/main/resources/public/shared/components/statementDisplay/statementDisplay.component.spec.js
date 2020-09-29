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
    injectSplitIRIFilter,
    injectPrefixationFilter
} from '../../../../../../test/js/Shared';

describe('Statement Display component', function() {
    var $compile, scope, splitIRI;

    beforeEach(function() {
        angular.mock.module('shared');
        injectSplitIRIFilter();
        injectPrefixationFilter();

        inject(function(_$compile_, _$rootScope_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            splitIRI = _splitIRIFilter_;
        });

        scope.predicate = 'predicate';
        scope.object = 'object';
        scope.entityNameFunc = jasmine.createSpy('entityNameFunc');
        var parent = $compile('<div></div>')(scope);
        parent.data('$statementContainerController', {});
        this.element = angular.element('<statement-display predicate="predicate" object="object" entity-name-func="entityNameFunc"></statement-display>');
        parent.append(this.element);
        this.element = $compile(this.element)(scope);
        splitIRI.and.returnValue({});
        scope.$digest();
        this.controller = this.element.controller('statementDisplay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('predicate should be one way bound', function() {
            this.controller.predicate = 'different';
            scope.$apply();
            expect(scope.predicate).toEqual('predicate');
        });
        it('object should be one way bound', function() {
            this.controller.object = 'different';
            scope.$apply();
            expect(scope.object).toEqual('object');
        });
        it('entityNameFunc should be one way bound', function() {
            this.controller.entityNameFunc = undefined;
            scope.$digest();
            expect(scope.entityNameFunc).toBeDefined();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('STATEMENT-DISPLAY');
            expect(this.element.querySelectorAll('.statement-display').length).toEqual(1);
        });
        it('with .statement-cells', function() {
            expect(this.element.querySelectorAll('.statement-cell').length).toEqual(2);
        });
    });
    describe('check controller.o value', function() {
        describe('when @id is present', function() {
            it('and split.end is present', function() {
                scope.entityNameFunc = undefined;
                scope.$digest();
                this.controller.object = {'@id': 'full/id'};
                splitIRI.and.returnValue({end: 'id'});
                this.controller.$onInit();
                expect(splitIRI).toHaveBeenCalledWith('full/id');
                expect(this.controller.o).toEqual('id <' + this.controller.fullObject + '>');
                expect(this.controller.fullObject).toEqual('full/id');
            });
            it('and split.end is empty', function() {
                scope.entityNameFunc = undefined;
                scope.$digest();
                this.controller.object = {'@id': 'full/id'};
                splitIRI.and.returnValue({end: ''});
                this.controller.$onInit();
                expect(splitIRI).toHaveBeenCalledWith('full/id');
                expect(this.controller.o).toEqual('full/id');
                expect(this.controller.fullObject).toEqual('full/id');
            });
        });
        it('when @value is present', function() {
            this.controller.object = {'@value': 'value'};
            splitIRI.and.returnValue({});
            this.controller.$onInit();
            expect(this.controller.o).toEqual('value');
            expect(this.controller.fullObject).toEqual('value');
        });
        it('when @language is present', function() {
            this.controller.object = {'@value': 'value', '@language': 'en'};
            splitIRI.and.returnValue({});
            this.controller.$onInit();
            expect(this.controller.o).toEqual('value [language: en]');
            expect(this.controller.fullObject).toEqual('value [language: en]');
        });
        it('when @type is present', function() {
            this.controller.object = {'@value': 'value', '@type': 'type'};
            splitIRI.and.returnValue({});
            this.controller.$onInit();
            expect(this.controller.o).toEqual('value [type: type]');
            expect(this.controller.fullObject).toEqual('value [type: type]');
        });
        it('when no extra information is present', function() {
            this.controller.object = 'words';
            splitIRI.and.returnValue({});
            this.controller.$onInit();
            expect(this.controller.o).toEqual('words');
            expect(this.controller.fullObject).toEqual('words');
        });
    });
    describe('check display obj method', function() {
        describe('when @id is present', function() {
            beforeEach(function() {
                this.controller.object = {'@id': 'full/id'};
                this.controller.fullObject = 'full/id';
                this.controller.o = 'id <' + this.controller.fullObject + '>';
            });
            it('and entityFunc is present', function() {
                scope.entityNameFunc.and.returnValue('label');
                expect(this.controller.displayObj()).toEqual('label <' + this.controller.fullObject + '>');
                expect(scope.entityNameFunc).toHaveBeenCalledWith(this.controller.fullObject);
            });
            it('and entityFunc is not present', function() {
                scope.entityNameFunc = undefined;
                scope.$digest();
                expect(this.controller.displayObj()).toEqual('id <' + this.controller.fullObject + '>');
            });
        });
        describe('when @id is not present', function() {
            beforeEach(function() {
                this.controller.object = {'@value': 'value'};
                this.controller.fullObject = 'value';
                this.controller.o = 'value';
            });
            it('and entityFunc is present', function() {
                expect(this.controller.displayObj()).toEqual('value');
                expect(scope.entityNameFunc).not.toHaveBeenCalled();
            });
            it('and entityFunc is not present', function() {
                scope.entityNameFunc = undefined;
                scope.$apply();
                expect(this.controller.displayObj()).toEqual('value');
            });
        });
    });
});