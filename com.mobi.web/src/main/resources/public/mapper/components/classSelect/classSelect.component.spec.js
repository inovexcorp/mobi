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
describe('Class Select component', function() {
    var $compile, scope, splitIRI;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockOntologyManager();
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            splitIRI = _splitIRIFilter_;
        });

        scope.classes = [];
        scope.selectedClass = undefined;
        scope.isDisabledWhen = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<class-select classes="classes" selected-class="selectedClass" change-event="changeEvent(value)" is-disabled-when="isDisabledWhen"></class-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('selectedClass should be one way bound', function() {
            this.controller.selectedClass = {};
            scope.$digest();
            expect(scope.selectedClass).toBeUndefined();
        });
        it('classes should be one way bound', function() {
            this.controller.classes = [{}];
            scope.$digest();
            expect(scope.classes).not.toEqual([{}]);
        });
        it('isDisabledWhen should be one way bound', function() {
            this.controller.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: {}});
            expect(scope.changeEvent).toHaveBeenCalledWith({});
        });
    });
    describe('controller methods', function() {
        it('should get the ontology id of a prop', function() {
            expect(this.controller.getOntologyId({ontologyId: 'test'})).toEqual('test');
            expect(splitIRI).not.toHaveBeenCalled();

            splitIRI.and.returnValue({begin: 'test'});
            expect(this.controller.getOntologyId({classObj: {'@id': ''}})).toEqual('test');
            expect(splitIRI).toHaveBeenCalledWith('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CLASS-SELECT');
            expect(this.element.querySelectorAll('.class-select').length).toEqual(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
    });
});