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
describe('IRI Template Overlay directive', function() {
    var $compile,
        scope;

    mockPrefixes();
    beforeEach(function() {
        module('iriTemplateOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/iriTemplateOverlay/iriTemplateOverlay.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.columns = [];
            scope.cancel = jasmine.createSpy('cancel');
            scope.set = jasmine.createSpy('set');
            scope.classMapping = {};

            this.element = $compile(angular.element('<iri-template-overlay columns="columns" cancel="cancel()" set="set(prefixEnd, localName)" class-mapping="classMapping"></iri-template-overlay>'))(scope);
            scope.$digest();
        });

        it('clickDelete should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.cancel();

            expect(scope.cancel).toHaveBeenCalled();
        });
        it('openProp should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.set();

            expect(scope.set).toHaveBeenCalled();
        });
        it('columns should be two way bound', function() {
            var controller = this.element.controller('iriTemplateOverlay');
            controller.columns = [''];
            scope.$digest();
            expect(scope.columns).toEqual(['']);
        });
        it('classMapping should be two way bound', function() {
            var controller = this.element.controller('iriTemplateOverlay');
            controller.classMapping = {'@id': ''};
            scope.$digest();
            expect(scope.classMapping).toEqual({'@id': ''});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.columns = [];
            scope.classMapping = {};

            this.element = $compile(angular.element('<iri-template-overlay columns="columns" cancel="cancel()" set="set(prefixEnd, localName)" class-mapping="classMapping"></iri-template-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('iri-template-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
            expect(this.element.querySelectorAll('.template-begins-with').length).toBe(1);
            expect(this.element.querySelectorAll('.template-then').length).toBe(1);
            expect(this.element.querySelectorAll('.template-ends-with').length).toBe(1);
        });
        it('with the correct classes for errors', function() {
            var failTests = ['/', '#', '?', ':', 'test/', '/test', 'test#', '#test', 'test?', '?test', 'test:', ':test', 'test#test', 'test?test', 'test:test'];
            var successTests = ['test', 'test/test', 'TEST_test', 'test.test'];
            var controller = this.element.controller('iriTemplateOverlay');
            var beginsWith = angular.element(this.element.querySelectorAll('.template-begins-with')[0]);
            expect(beginsWith.hasClass('has-error')).toBe(true);
            
            failTests.forEach(function(test) {
                controller.beginsWith = test;
                scope.$digest();
                expect(beginsWith.hasClass('has-error')).toBe(true);
            });
            successTests.forEach(function(test) {
                controller.beginsWith = test;
                scope.$digest();
                expect(beginsWith.hasClass('has-error')).toBe(false);
            });
        });
        it('with the correct number of options for ends with', function() {
            var controller = this.element.controller('iriTemplateOverlay');
            var endsWith = angular.element(this.element.querySelectorAll('.template-ends-with select')[0]);
            expect(endsWith.find('option').length).toBe(controller.localNameOptions.length);
        });
        it('with custom buttons to cancel and set', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});