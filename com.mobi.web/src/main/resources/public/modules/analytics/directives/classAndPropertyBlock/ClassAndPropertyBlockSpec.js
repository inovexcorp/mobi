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
describe('Class And Property Block directive', function() {
    var $compile, scope, $q, analyticStateSvc, prefixes, utilSvc;

    beforeEach(function() {
        module('templates');
        module('classAndPropertyBlock');
        mockAnalyticState();
        mockPrefixes();
        mockUtil();

        inject(function(_$q_, _$compile_, _$rootScope_, _analyticStateService_, _prefixes_, _utilService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            analyticStateSvc = _analyticStateService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
        });

        analyticStateSvc.classes = [{title: 'class', id: 'class-id'}];
        analyticStateSvc.properties = [{title: 'property', id: 'property-id'}];
    });

    beforeEach(function compile() {
        this.compile = function() {
            this.element = $compile(angular.element('<class-and-property-block></class-and-property-block>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('classAndPropertyBlock');
        }
    });

    afterEach(function () {
        $compile = null;
        scope = null;
        $q = null;
        analyticStateSvc = null;
        prefixes = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('class-and-property-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with .list-containers', function() {
            expect(this.element.querySelectorAll('.list-container').length).toBe(2);
        });
        it('with .list-container h1s', function() {
            expect(this.element.querySelectorAll('.list-container h1').length).toBe(2);
        });
        it('with .list-container md-list-item', function() {
            expect(this.element.querySelectorAll('.list-container md-list-item').length).toBe(2);
            analyticStateSvc.classes = [];
            analyticStateSvc.properties = [];
            scope.$apply();
            expect(this.element.querySelectorAll('.list-container md-list-item').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        describe('isDisabled returns the proper value when classes', function() {
            it('contains selectedClass id', function() {
                analyticStateSvc.selectedClass = {id: 'id'};
                expect(this.controller.isDisabled(['id'])).toBe(false);
            });
            it('does not contain selectedClass id', function() {
                expect(this.controller.isDisabled(['id'])).toBe(true);
            });
        });
    });
    describe('initializes values correctly when classes and properties are', function() {
        it('populated', function() {
            this.compile();
            expect(analyticStateSvc.setClassesAndProperties).not.toHaveBeenCalled();
        });
        describe('empty and setClassesAndProperties is', function() {
            beforeEach(function() {
                analyticStateSvc.classes = [];
                analyticStateSvc.properties = [];
            });
            it('resolved', function() {
                this.compile();
                expect(analyticStateSvc.setClassesAndProperties).toHaveBeenCalled();
            });
            it('rejected', function() {
                analyticStateSvc.setClassesAndProperties.and.returnValue($q.reject('error'));
                this.compile();
                expect(analyticStateSvc.setClassesAndProperties).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
    });
});