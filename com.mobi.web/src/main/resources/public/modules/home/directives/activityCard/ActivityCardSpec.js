/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Activity Card directive', function() {
    var $compile, scope, $q, provManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('activityCard');
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

        this.headers = {
            'x-total-count': 2,
        };
        this.response = {
            data: {
                activities: [{'@id': 'activity1'}, {'@id': 'activity2'}],
                entities: [{'@id': 'entity1'}]
            },
            headers: jasmine.createSpy('headers').and.returnValue(this.headers)
        };

        provManagerSvc.getActivities.and.returnValue($q.when(this.response));
    });

    beforeEach(function compile() {
        this.compile = function() {
            this.element = $compile(angular.element('<activity-card></activity-card>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('activityCard');
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        provManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('should initialize with the correct data', function() {
        it('unless an error occurs', function() {
            provManagerSvc.getActivities.and.returnValue($q.reject('Error message'));
            this.compile();
            expect(provManagerSvc.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: this.controller.limit}, this.controller.id);
            expect(this.controller.activities).toEqual([]);
            expect(this.controller.entities).toEqual([]);
            expect(this.controller.totalSize).toEqual(0);
            expect(this.controller.limit).toEqual(10);
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
        });
        it('successfully', function() {
            this.compile();
            expect(provManagerSvc.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: this.controller.limit}, this.controller.id);
            expect(this.controller.activities).toEqual(this.response.data.activities);
            expect(this.controller.entities).toEqual(this.response.data.entities);
            expect(this.controller.totalSize).toEqual(this.headers['x-total-count']);
            expect(this.controller.limit).toEqual(10);
            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        describe('should set the page of Activities', function() {
            it('successfully', function() {
                provManagerSvc.getActivities.and.returnValue($q.when(this.response));
                this.controller.setPage();
                scope.$apply();
                expect(provManagerSvc.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: this.controller.limit}, this.controller.id);
                expect(this.controller.activities).toEqual(this.response.data.activities);
                expect(this.controller.entities).toEqual(this.response.data.entities);
                expect(this.controller.totalSize).toEqual(this.headers['x-total-count']);
            });
            it('unless an error occurs', function() {
                provManagerSvc.getActivities.and.returnValue($q.reject('Error message'));
                this.controller.setPage();
                scope.$apply();
                expect(provManagerSvc.getActivities).toHaveBeenCalledWith({pageIndex: 0, limit: this.controller.limit}, this.controller.id);
            });
        });
        it('should load more activities', function() {
            var limit = this.controller.limit;
            spyOn(this.controller, 'setPage');
            this.controller.loadMore();
            expect(this.controller.limit).toEqual(limit + 10);
            expect(this.controller.setPage).toHaveBeenCalled();
        });
        it('should get the time stamp of an Activity', function() {
            utilSvc.getPropertyValue.and.returnValue('2017-01-01T00:00:00');
            utilSvc.getDate.and.returnValue('date');
            expect(this.controller.getTimeStamp({})).toEqual('date');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.prov + 'endedAtTime');
            expect(utilSvc.getDate).toHaveBeenCalledWith('2017-01-01T00:00:00', 'short');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('activity-card')).toBe(true);
            expect(this.element.hasClass('card')).toBe(true);
            expect(this.element.querySelectorAll('.card-header').length).toBe(1);
            expect(this.element.querySelectorAll('.card-body').length).toBe(1);
        });
        it('with a .card-header-tabs', function() {
            expect(this.element.querySelectorAll('.card-header-tabs').length).toBe(1);
        });
        it('with a .nav-item', function() {
            expect(this.element.querySelectorAll('.card-header-tabs .nav-item').length).toBe(1);
        });
        it('depending on how many activities there are', function() {
            scope.$apply();
            expect(this.element.querySelectorAll('.activity').length).toBe(this.controller.activities.length);
            expect(this.element.querySelectorAll('.btn').length).toBe(0);

            this.controller.totalSize = 10;
            scope.$digest();
            expect(this.element.querySelectorAll('.activity').length).toBe(this.controller.activities.length);
            expect(this.element.querySelectorAll('.btn').length).toBe(1);
        });
    });
});