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
        element,
        controller,
        ontologyManagerSvc,
        stateManagerSvc;

    injectRegexConstant();
    beforeEach(function() {
        module('templates');
        module('ontologyDownloadOverlay');
        mockStateManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _stateManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
        });
    });

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
                scope.dvm = {
                    form: {
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
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('ontologyDownloadOverlay');
        });
        it('download calls the correct manager function', function() {
            controller.download('serialization', 'fileName');
            expect(ontologyManagerSvc.download).toHaveBeenCalledWith(stateManagerSvc.ontology['@id'], 'serialization', 'fileName')
            expect(stateManagerSvc.showDownloadOverlay).toBe(false);
        });
    });
});