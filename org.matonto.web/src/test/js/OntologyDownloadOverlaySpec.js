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
describe('Ontology Download Overlay directive', function() {
    var $compile,
        scope,
        element;

    injectRegexConstant();

    beforeEach(function() {
        module('ontologyDownloadOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/ontologyDownloadOverlay/ontologyDownloadOverlay.html');

    beforeEach(function() {
        element = $compile(angular.element('<ontology-download-overlay></ontology-download-overlay>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .content', function() {
            var items = element.querySelectorAll('.content');
            expect(items.length).toBe(1);
        });
        it('based on h6', function() {
            var items = element.querySelectorAll('h6');
            expect(items.length).toBe(1);
        });
        it('based on .form-group', function() {
            var items = element.querySelectorAll('.form-group');
            expect(items.length).toBe(1);
        });
        it('based on .btn-container', function() {
            var items = element.querySelectorAll('.btn-container');
            expect(items.length).toBe(1);
        });
        it('based on .error-msg', function() {
            var items = element.querySelectorAll('.error-msg');
            expect(items.length).toBe(1);
        });
        describe('and has-error class', function() {
            it('is not there when variable is undefined', function() {
                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(false);
            });
            it('is there when variable is true', function() {
                scope.vm = {
                    downloadForm: {
                        fileName: {
                            '$error': {
                                pattern: true
                            }
                        }
                    }
                }
                scope.$digest();

                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(true);
            });
        });
    });
});