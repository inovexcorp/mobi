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
describe('Class Block Header directive', function() {
    var $compile, scope, element, exploreSvc, discoverStateSvc, $q, controller, util;

    beforeEach(function() {
        module('templates');
        module('classBlockHeader');
        mockDiscoverState();
        mockExplore();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _exploreService_, _discoverStateService_, _$q_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            exploreSvc = _exploreService_;
            discoverStateSvc = _discoverStateService_;
            $q = _$q_;
            util = _utilService_;
        });

        element = $compile(angular.element('<class-block-header></class-block-header>'))(scope);
        scope.$digest();
        controller = element.controller('classBlockHeader');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('FORM');
            expect(element.hasClass('class-block-header')).toBe(true);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a dataset-select', function() {
            expect(element.find('dataset-select').length).toBe(1);
        });
        it('with a .btn.btn-primary', function() {
            expect(element.querySelectorAll('.btn.btn-primary').length).toBe(1);
        });
        it('with a .fa.fa-refresh', function() {
            expect(element.querySelectorAll('.fa.fa-refresh').length).toBe(1);
        });
    });
    
    describe('controller methods', function() {
        describe('onSelect calls the proper methods when getClassDetails', function() {
            beforeEach(function() {
                discoverStateSvc.explore.recordId = 'recordId';
                discoverStateSvc.explore.classDetails = [{}];
            });
            it('resolves', function() {
                exploreSvc.getClassDetails.and.returnValue($q.when([{prop: 'details'}]));
                controller.onSelect();
                scope.$apply();
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('recordId');
                expect(discoverStateSvc.explore.classDetails).toEqual([{prop: 'details'}]);
            });
            it('rejects', function() {
                exploreSvc.getClassDetails.and.returnValue($q.reject('error'));
                controller.onSelect();
                scope.$apply();
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('recordId');
                expect(discoverStateSvc.explore.classDetails).toEqual([]);
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
    });
});