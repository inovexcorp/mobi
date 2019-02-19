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
describe('Edit IRI Overlay directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'errorDisplay')
        injectRegexConstant();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.isDisabled = false;
        scope.resolve = {
            iriBegin: 'begin',
            iriThen: '/',
            iriEnd: 'end',
            customValidation: {
                func: () => this.isDisabled,
                msg: 'Error'
            }
        };
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<edit-iri-overlay resolve="resolve" close="close($value)" dismiss="dismiss()"></edit-iri-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editIriOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('EDIT-IRI-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with a h3', function() {
            expect(this.element.find('h3').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('depending on whether the begin field is invalid', function() {
            var beginInput = angular.element(this.element.querySelectorAll('.begin-container input')[0]);
            expect(beginInput.hasClass('is-invalid')).toBe(false);

            this.controller.iriForm = {
                iriBegin: {
                    '$error': {
                        pattern: true
                    }
                }
            };
            scope.$digest();
            expect(beginInput.hasClass('is-invalid')).toBe(true);
        });
        it('depending on whether the ends field is invalid', function() {
            var endsInput = angular.element(this.element.querySelectorAll('.ends-container input')[0]);
            expect(endsInput.hasClass('is-invalid')).toBe(false);

            this.controller.iriForm = {
                iriEnd: {
                    '$error': {
                        pattern: true
                    }
                }
            };
            scope.$digest();
            expect(endsInput.hasClass('is-invalid')).toBe(true);
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary:not(.refresh-button)')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.iriForm.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        describe('depending on whether the custom validator', function() {
            beforeEach(function() {
                this.controller.iriForm.$invalid = false;
            });
            describe('is present and returns', function() {
                it('true', function() {
                    this.isDisabled = true;
                    scope.$digest();

                    var disabled = this.element.querySelectorAll(':disabled');
                    expect(disabled.length).toBe(1);
                    expect(angular.element(disabled[0]).text()).toBe('Submit');

                    var errorDisplay = this.element.find('error-display');
                    expect(errorDisplay.length).toEqual(1);
                    expect(errorDisplay.text()).toEqual(scope.resolve.customValidation.msg);
                });
                it('false', function() {
                    expect(this.element.querySelectorAll(':disabled').length).toBe(0);
                    expect(this.element.find('error-display').length).toBe(0);
                });
            });
            it('is not present', function() {
                delete scope.resolve.customValidation;
                scope.$digest();

                expect(this.element.querySelectorAll(':disabled').length).toBe(0);
                expect(this.element.find('error-display').length).toBe(0);
            });
        });
    });
    describe('controller methods', function() {
        it('submit edits the iri', function() {
            this.controller.submit();
            expect(scope.close).toHaveBeenCalledWith({iriBegin: this.controller.iriBegin, iriThen: this.controller.iriThen, iriEnd: this.controller.iriEnd});
        });
        it('resetVariables updates iriBegin, iriThen, and iriEnd', function() {
            this.controller.iriBegin = 'new';
            this.controller.iriThen = 'new';
            this.controller.iriEnd = 'new';
            this.controller.resetVariables();
            expect(this.controller.iriBegin).toBe(scope.resolve.iriBegin);
            expect(this.controller.iriThen).toBe(scope.resolve.iriThen);
            expect(this.controller.iriEnd).toBe(scope.resolve.iriEnd);
        });
        it('cancel calls dismiss', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
});
