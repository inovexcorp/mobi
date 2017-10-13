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
describe('Filter Selector directive', function() {
    var $compile, scope, element, controller, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('filterSelector');
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        scope.begin = 'begin';
        scope.end = 'end';
        scope.filterType = undefined;
        scope.range = 'range';
        scope.regex = '/[a-zA-Z]/';
        scope.value = 'value';
        scope.boolean = false;
        element = $compile(angular.element('<filter-selector begin="begin" end="end" filter-type="filterType" range="range" regex="regex" value="value" boolean="boolean"></filter-selector>'))(scope);
        scope.$digest();
        controller = element.controller('filterSelector');
    });

    describe('controller bound variable', function() {
        it('begin should be two way bound', function() {
            controller.begin = 'new-begin';
            scope.$apply();
            expect(scope.begin).toEqual('new-begin');
        });
        it('end should be two way bound', function() {
            controller.end = 'new-end';
            scope.$apply();
            expect(scope.end).toEqual('new-end');
        });
        it('filterType should be two way bound', function() {
            controller.filterType = 'new-type';
            scope.$apply();
            expect(scope.filterType).toEqual('new-type');
        });
        it('range should be one way bound', function() {
            controller.range = 'new-range';
            scope.$apply();
            expect(scope.range).toEqual('range');
        });
        it('regex should be two way bound', function() {
            controller.regex = '/[a-z]/';
            scope.$apply();
            expect(scope.regex).toEqual('/[a-z]/');
        });
        it('value should be two way bound', function() {
            controller.value = 'new-value';
            scope.$apply();
            expect(scope.value).toEqual('new-value');
        });
        it('boolean should be two way bound', function() {
            controller.boolean = true;
            scope.$apply();
            expect(scope.boolean).toEqual(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('filter-selector')).toBe(true);
        });
        describe('when isBoolean is', function() {
            describe('false', function() {
                beforeEach(function() {
                    spyOn(controller, 'isBoolean').and.returnValue(false);
                    scope.$apply();
                });
                it('with a custom-label', function() {
                    expect(element.find('custom-label').length).toBe(1);
                });
                it('with a md-select', function() {
                    expect(element.find('md-select').length).toBe(1);
                });
                describe('with md-options when type is', function() {
                    it('datetime-local', function() {
                        controller.type = 'datetime-local';
                        scope.$apply();
                        expect(element.find('md-option').length).toBe(7);
                    });
                    it('number', function() {
                        controller.type = 'number';
                        scope.$apply();
                        expect(element.find('md-option').length).toBe(7);
                    });
                    it('text', function() {
                        controller.type = 'text';
                        scope.$apply();
                        expect(element.find('md-option').length).toBe(4);
                    });
                });
                describe('and filterType is', function() {
                    it('Existence with a .input-container', function() {
                        controller.filterType = 'Existence';
                        scope.$apply();
                        expect(element.find('.input-container').length).toBe(0);
                    });
                    describe('Regex', function() {
                        beforeEach(function() {
                            controller.filterType = 'Regex';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(element.find('input').length).toBe(1);
                        });
                    });
                    describe('Contains', function() {
                        beforeEach(function() {
                            controller.filterType = 'Contains';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(element.find('input').length).toBe(1);
                        });
                    });
                    describe('Exact', function() {
                        beforeEach(function() {
                            controller.filterType = 'Exact';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(element.find('input').length).toBe(1);
                        });
                    });
                    describe('Range', function() {
                        beforeEach(function() {
                            controller.filterType = 'Range';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a .range-container', function() {
                            expect(element.querySelectorAll('.range-container').length).toBe(1);
                        });
                        it('with md-input-containers', function() {
                            expect(element.find('md-input-container').length).toBe(2);
                        });
                        it('with inputs', function() {
                            expect(element.find('input').length).toBe(2);
                        });
                    });
                });
            });
            describe('true', function() {
                beforeEach(function() {
                    spyOn(controller, 'isBoolean').and.returnValue(true);
                    scope.$apply();
                });
                it('with a custom-label', function() {
                    expect(element.find('custom-label').length).toBe(1);
                });
                it('with a md-select', function() {
                    expect(element.find('md-select').length).toBe(1);
                });
                it('with md-options', function() {
                    expect(element.find('md-option').length).toBe(2);
                });
            });
        });
    });
    describe('controller methods', function() {
        it('needsOneInput should return whether or not the value is in the array', function() {
            _.forEach(['Contains', 'Exact', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to'], function(item) {
                controller.filterType = item;
                expect(controller.needsOneInput()).toBe(true);
            });
            controller.filterType = 'Other';
            expect(controller.needsOneInput()).toBe(false);
        });
        describe('isBoolean returns the correct value when range', function() {
            it('is xsd:boolean', function() {
                controller.range = prefixes.xsd + 'boolean';
                expect(controller.isBoolean()).toBe(true);
            });
            it('is not xsd:boolean', function() {
                expect(controller.isBoolean()).toBe(false);
            });
        });
    });
});
