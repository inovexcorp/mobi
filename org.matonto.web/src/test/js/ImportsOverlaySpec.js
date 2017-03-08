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
describe('Imports Overlay directive', function() {
    var $q, $compile, scope, element, controller;

    beforeEach(function() {
        module('templates');
        module('importsOverlay');
        injectRegexConstant();
        mockOntologyState();
        mockUtil();
        mockPrefixes();
        mockOntologyManager();

        inject(function(_$q_, _$compile_, _$rootScope_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.onClose = jasmine.createSpy('onClose');
        element = $compile(angular.element('<imports-overlay on-close="onClose()"></imports-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('importsOverlay');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('imports-overlay')).toBe(true);
        });
        it('with a .content', function() {
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .error-msg', function() {
            expect(element.querySelectorAll('.error-msg').length).toBe(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the url pattern is incorrect', function() {
            var formGroup = angular.element(element.querySelectorAll('.form-group')[0]);
            expect(formGroup.hasClass('has-error')).toBe(false);
            controller.form = {
                url: {
                    '$error': {
                        pattern: true
                    }
                }
            }
            scope.$digest();
            expect(formGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = true;
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('create should call the correct methods', function() {

        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(controller, 'create');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
});