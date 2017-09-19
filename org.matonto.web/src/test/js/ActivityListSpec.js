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
describe('Activity List directive', function() {
    var $compile, scope, element, controller, $q, provManagerSvc, utilSvc, prefixes;
    var headers = { 'x-total-count': 2 };
    var response = {
        data: {
            activities: [{'@id': 'activity1'}, {'@id': 'activity2'}],
            entities: [{'@id': 'entity1'}]
        },
        headers: jasmine.createSpy('headers').and.returnValue(headers)
    };
    var nextLink = 'http://example.com/next';
    var prevLink = 'http://example.com/prev';

    beforeEach(function() {
        module('templates');
        module('activityList');
        mockProvManager();
        mockUtil();
        mockPrefixes();
        mockHttpService();

        inject(function(_$compile_, _$rootScope_, _$q_, _provManagerService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            provManagerSvc = _provManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        provManagerSvc.getActivities.and.returnValue($q.when(response));
        headers.link = '<' + nextLink + '>; rel=\"next\", <' + prevLink + '>; rel=\"prev\"';
        utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
        element = $compile(angular.element('<activity-list></activity-list>'))(scope);
        scope.$digest();
        controller = element.controller('activityList');
    });

    describe('should initialize with the correct data', function() {
        it('unless an error occurs', function() {
            utilSvc.parseLinks.calls.reset();
            provManagerSvc.getActivities.and.returnValue($q.reject('Error message'));
            element = $compile(angular.element('<activity-list></activity-list>'))(scope);
            scope.$digest();
            controller = element.controller('activityList');
            expect(provManagerSvc.getActivities).toHaveBeenCalledWith(controller.paginatedConfig, controller.id);
            expect(utilSvc.parseLinks).not.toHaveBeenCalled();
            expect(controller.activities).toEqual([]);
            expect(controller.entities).toEqual([]);
            expect(controller.totalSize).toEqual(0);
            expect(controller.paginatedConfig).toEqual({limit: 50, pageIndex: 0});
            expect(controller.links).toEqual({prev: '', next: ''});
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
        });
        it('successfully', function() {
            expect(provManagerSvc.getActivities).toHaveBeenCalledWith(controller.paginatedConfig, controller.id);
            expect(utilSvc.parseLinks).toHaveBeenCalledWith(headers.link);
            expect(controller.activities).toEqual(response.data.activities);
            expect(controller.entities).toEqual(response.data.entities);
            expect(controller.totalSize).toEqual(headers['x-total-count']);
            expect(controller.paginatedConfig).toEqual({limit: 50, pageIndex: 0});
            expect(controller.links).toEqual({prev: prevLink, next: nextLink});
            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should get a page of Activities', function() {
            var index;
            beforeEach(function() {
                index = controller.paginatedConfig.pageIndex;
                utilSvc.parseLinks.and.returnValue({});
                utilSvc.parseLinks.calls.reset();
            });
            describe('successfully', function() {
                beforeEach(function() {
                    utilSvc.getResultsPage.and.returnValue($q.when(response));
                });
                it('if the direction is previous', function() {
                    controller.getPage('prev');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith(prevLink, utilSvc.rejectError, controller.id);
                    expect(utilSvc.parseLinks).toHaveBeenCalledWith(headers.link);
                    expect(controller.paginatedConfig.pageIndex).toBe(index - 1);
                    expect(controller.activities).toEqual(response.data.activities);
                    expect(controller.entities).toEqual(response.data.entities);
                    expect(controller.totalSize).toEqual(headers['x-total-count']);
                    expect(controller.links).toEqual({prev: '', next: ''});
                });
                it('if the direction is next', function() {
                    controller.getPage('next');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith(nextLink, utilSvc.rejectError, controller.id);
                    expect(utilSvc.parseLinks).toHaveBeenCalledWith(headers.link);
                    expect(controller.paginatedConfig.pageIndex).toBe(index + 1);
                    expect(controller.activities).toEqual(response.data.activities);
                    expect(controller.entities).toEqual(response.data.entities);
                    expect(controller.totalSize).toEqual(headers['x-total-count']);
                    expect(controller.links).toEqual({prev: '', next: ''});
                });
            });
            describe('unless an error occurs', function() {
                beforeEach(function() {
                    utilSvc.getResultsPage.and.returnValue($q.reject('Error message'));
                });
                it('and the direction was previous', function() {
                    controller.getPage('prev');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith(prevLink, utilSvc.rejectError, controller.id);
                    expect(utilSvc.parseLinks).not.toHaveBeenCalled();
                });
                it('and the direction was next', function() {
                    controller.getPage('next');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith(nextLink, utilSvc.rejectError, controller.id);
                    expect(utilSvc.parseLinks).not.toHaveBeenCalled();
                });
            });
        });
        it('should get the time stamp of an Activity', function() {
            utilSvc.getPropertyValue.and.returnValue('2017-01-01T00:00:00');
            utilSvc.getDate.and.returnValue('date');
            expect(controller.getTimeStamp({})).toEqual('date');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.prov + 'endedAtTime');
            expect(utilSvc.getDate).toHaveBeenCalledWith('2017-01-01T00:00:00', 'short');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('activity-list')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
            expect(element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with block-footer', function() {
            expect(element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(element.find('pagination').length).toBe(1);
        });
        it('depending on how many activities there are', function() {
            expect(element.querySelectorAll('block-content .activity').length).toBe(controller.activities.length);
        });
    });
});
