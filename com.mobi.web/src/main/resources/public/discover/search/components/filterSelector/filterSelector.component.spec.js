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
describe('Filter Selector component', function() {
    var $compile, scope, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('search');
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        scope.begin = 'begin';
        scope.updateBegin = jasmine.createSpy('updateBegin');
        scope.end = 'end';
        scope.updateEnd = jasmine.createSpy('updateEnd');
        scope.filterType = undefined;
        scope.updateFilterType = jasmine.createSpy('updateFilterType');
        scope.range = 'range';
        scope.regex = '/[a-zA-Z]/';
        scope.updateRegex = jasmine.createSpy('updateRegex');
        scope.value = 'value';
        scope.updateValue = jasmine.createSpy('updateValue');
        scope.boolean = false;
        scope.updateBoolean = jasmine.createSpy('updateBoolean');
        this.element = $compile(angular.element('<filter-selector begin="begin" update-begin="updateBegin(value)" end="end" update-end="updateEnd(value)" filter-type="filterType" update-filter-type="updateFilterType(value)" range="range" regex="regex" update-regex="updateRegex(value)" value="value" update-value="updateValue(value)" boolean="boolean" update-boolean="updateBoolean(value)"></filter-selector>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('filterSelector');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('begin should be one way bound', function() {
            var copy = angular.copy(this.controller.begin);
            this.controller.begin = 'new-begin';
            scope.$apply();
            expect(scope.begin).toEqual(copy);
        });
        it('updateBegin should be called in the parent scope', function() {
            this.controller.updateBegin({value: 'Test'});
            expect(scope.updateBegin).toHaveBeenCalledWith('Test');
        });
        it('end should be one way bound', function() {
            var copy = angular.copy(this.controller.end);
            this.controller.end = 'new-end';
            scope.$apply();
            expect(scope.end).toEqual(copy);
        });
        it('updateEnd should be called in the parent scope', function() {
            this.controller.updateEnd({value: 'Test'});
            expect(scope.updateEnd).toHaveBeenCalledWith('Test');
        });
        it('filterType should be one way bound', function() {
            var copy = angular.copy(this.controller.filterType);
            this.controller.filterType = 'new-filterType';
            scope.$apply();
            expect(scope.filterType).toEqual(copy);
        });
        it('updateFilterType should be called in the parent scope', function() {
            this.controller.updateFilterType({value: 'Test'});
            expect(scope.updateFilterType).toHaveBeenCalledWith('Test');
        });
        it('range should be one way bound', function() {
            this.controller.range = 'new-range';
            scope.$apply();
            expect(scope.range).toEqual('range');
        });
        it('regex should be one way bound', function() {
            var copy = angular.copy(this.controller.regex);
            this.controller.regex = 'new-regex';
            scope.$apply();
            expect(scope.regex).toEqual(copy);
        });
        it('updateRegex should be called in the parent scope', function() {
            this.controller.updateRegex({value: 'Test'});
            expect(scope.updateRegex).toHaveBeenCalledWith('Test');
        });
        it('value should be one way bound', function() {
            var copy = angular.copy(this.controller.value);
            this.controller.value = 'new-value';
            scope.$apply();
            expect(scope.value).toEqual(copy);
        });
        it('updateValue should be called in the parent scope', function() {
            this.controller.updateValue({value: 'Test'});
            expect(scope.updateValue).toHaveBeenCalledWith('Test');
        });
        it('boolean should be one way bound', function() {
            this.controller.boolean = true;
            scope.$apply();
            expect(scope.boolean).toEqual(false);
        });
        it('updateBoolean should be called in the parent scope', function() {
            this.controller.updateBoolean({value: true});
            expect(scope.updateBoolean).toHaveBeenCalledWith(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('FILTER-SELECTOR');
        });
        describe('when isBoolean is', function() {
            describe('false', function() {
                beforeEach(function() {
                    spyOn(this.controller, 'isBoolean').and.returnValue(false);
                    scope.$apply();
                });
                it('with a custom-label', function() {
                    expect(this.element.find('custom-label').length).toBe(1);
                });
                it('with a md-select', function() {
                    expect(this.element.find('md-select').length).toBe(1);
                });
                describe('with md-options when type is', function() {
                    it('datetime-local', function() {
                        this.controller.type = 'datetime-local';
                        scope.$apply();
                        expect(this.element.find('md-option').length).toBe(7);
                    });
                    it('number', function() {
                        this.controller.type = 'number';
                        scope.$apply();
                        expect(this.element.find('md-option').length).toBe(7);
                    });
                    it('text', function() {
                        this.controller.type = 'text';
                        scope.$apply();
                        expect(this.element.find('md-option').length).toBe(4);
                    });
                });
                describe('and filterType is', function() {
                    it('Existence with a .input-container', function() {
                        this.controller.filterType = 'Existence';
                        scope.$apply();
                        expect(this.element.find('.input-container').length).toBe(0);
                    });
                    describe('Regex', function() {
                        beforeEach(function() {
                            this.controller.filterType = 'Regex';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(this.element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(this.element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(this.element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(this.element.find('input').length).toBe(1);
                        });
                    });
                    describe('Contains', function() {
                        beforeEach(function() {
                            this.controller.filterType = 'Contains';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(this.element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(this.element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(this.element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(this.element.find('input').length).toBe(1);
                        });
                    });
                    describe('Exact', function() {
                        beforeEach(function() {
                            this.controller.filterType = 'Exact';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(this.element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(this.element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a md-input-container', function() {
                            expect(this.element.find('md-input-container').length).toBe(1);
                        });
                        it('with a input', function() {
                            expect(this.element.find('input').length).toBe(1);
                        });
                    });
                    describe('Range', function() {
                        beforeEach(function() {
                            this.controller.filterType = 'Range';
                            scope.$apply();
                        });
                        it('with a .input-container', function() {
                            expect(this.element.querySelectorAll('.input-container').length).toBe(1);
                        });
                        it('with a custom-label', function() {
                            expect(this.element.querySelectorAll('.input-container custom-label').length).toBe(1);
                        });
                        it('with a .range-container', function() {
                            expect(this.element.querySelectorAll('.range-container').length).toBe(1);
                        });
                        it('with md-input-containers', function() {
                            expect(this.element.find('md-input-container').length).toBe(2);
                        });
                        it('with inputs', function() {
                            expect(this.element.find('input').length).toBe(2);
                        });
                    });
                });
            });
            describe('true', function() {
                beforeEach(function() {
                    spyOn(this.controller, 'isBoolean').and.returnValue(true);
                    scope.$apply();
                });
                it('with a custom-label', function() {
                    expect(this.element.find('custom-label').length).toBe(1);
                });
                it('with a md-select', function() {
                    expect(this.element.find('md-select').length).toBe(1);
                });
                it('with md-options', function() {
                    expect(this.element.find('md-option').length).toBe(2);
                });
            });
        });
    });
    describe('controller methods', function() {
        it('needsOneInput should return whether or not the value is in the array', function() {
            ['Contains', 'Exact', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to'].forEach(function(item) {
                this.controller.filterType = item;
                expect(this.controller.needsOneInput()).toBe(true);
            }, this);
            this.controller.filterType = 'Other';
            expect(this.controller.needsOneInput()).toBe(false);
        });
        describe('isBoolean returns the correct value when range', function() {
            it('is xsd:boolean', function() {
                this.controller.range = prefixes.xsd + 'boolean';
                expect(this.controller.isBoolean()).toBe(true);
            });
            it('is not xsd:boolean', function() {
                expect(this.controller.isBoolean()).toBe(false);
            });
        });
    });
});
