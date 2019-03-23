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
describe('Class Cards component', function() {
    var $compile, scope, discoverStateSvc, exploreSvc, utilSvc, $q;

    beforeEach(function() {
        module('templates');
        module('explore');
        mockDiscoverState();
        mockUtil();
        mockExplore();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _exploreService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        discoverStateSvc.explore.recordId = 'recordId';
        scope.classDetails = [{
            instancesCount: 1,
            classTitle: 'z'
        }, {
            instancesCount: 2,
            classTitle: 'z'
        }, {
            instancesCount: 2,
            classTitle: 'a'
        }, {
            instancesCount: 1,
            classTitle: 'a'
        }];
        this.element = $compile(angular.element('<class-cards class-details="classDetails"></class-cards>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classCards');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        exploreSvc = null;
        utilSvc = null;
        $q = null;
        this.element.remove();
    });

    describe('initializes with the correct values', function() {
        it('for chunks', function() {
            var expected = [[{
                instancesCount: 2,
                classTitle: 'a'
            }, {
                instancesCount: 2,
                classTitle: 'z'
            }, {
                instancesCount: 1,
                classTitle: 'a'
            }], [{
                instancesCount: 1,
                classTitle: 'z'
            }]];
            expect(angular.copy(this.controller.chunks)).toEqual(expected);
        });
    });
    describe('controller bound variable', function() {
        it('classDetails should be one way bound', function() {
            var copy = angular.copy(this.controller.classDetails);
            this.controller.classDetails = [];
            scope.$digest();
            expect(scope.classDetails).toEqual(copy);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CLASS-CARDS');
        });
        it('with a .rows-container.h-100', function() {
            expect(this.element.querySelectorAll('.rows-container.h-100').length).toBe(1);
        });
        it('with .rows', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('exploreData should set the correct variables when getClassInstances is', function() {
            it('resolved', function() {
                var data = [{prop: 'data'}];
                var nextLink = 'http://example.com/next';
                var prevLink = 'http://example.com/prev';
                var headers = jasmine.createSpy('headers').and.returnValue({
                    'x-total-count': 10,
                    link: 'link'
                });
                utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
                discoverStateSvc.explore.breadcrumbs = [''];
                discoverStateSvc.explore.instanceDetails.data = [{prop: 'old'}];
                exploreSvc.getClassInstanceDetails.and.returnValue($q.when({data: data, headers: headers}));
                exploreSvc.createPagedResultsObject.and.returnValue({prop: 'paged', data: [{prop: 'new'}]});
                this.controller.exploreData({classTitle: 'new', classIRI: 'classId', deprecated: true});
                scope.$apply();
                expect(discoverStateSvc.explore.classId).toBe('classId');
                expect(discoverStateSvc.explore.classDeprecated).toBe(true);
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith('recordId', 'classId', {offset: 0, limit: discoverStateSvc.explore.instanceDetails.limit});
                expect(discoverStateSvc.resetPagedInstanceDetails).toHaveBeenCalled();
                expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith({data: data, headers: headers});
                expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({
                    prop: 'paged',
                    data: [{prop: 'new'}]
                }));
                expect(discoverStateSvc.explore.breadcrumbs).toEqual(['', 'new']);
            });
            it('rejected', function() {
                exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                this.controller.exploreData({classTitle: 'new', classIRI: 'classId'});
                scope.$apply();
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith('recordId', 'classId', {offset: 0, limit: discoverStateSvc.explore.instanceDetails.limit});
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
    });
});