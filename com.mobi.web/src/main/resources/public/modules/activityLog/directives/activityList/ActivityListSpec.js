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
describe('Activity List directive', function() {
    var $compile, scope, $q, provManagerSvc, utilSvc, prefixes;

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
            this.element = $compile(angular.element('<activity-list></activity-list>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('activityList');
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
            expect(provManagerSvc.getActivities).toHaveBeenCalledWith({pageIndex: this.controller.currentPage - 1, limit: this.controller.limit}, this.controller.id);
            expect(this.controller.activities).toEqual([]);
            expect(this.controller.entities).toEqual([]);
            expect(this.controller.totalSize).toEqual(0);
            expect(this.controller.currentPage).toEqual(1);
            expect(this.controller.limit).toEqual(50);
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
        });
        it('successfully', function() {
            this.compile();
            expect(provManagerSvc.getActivities).toHaveBeenCalledWith({pageIndex: this.controller.currentPage - 1, limit: this.controller.limit}, this.controller.id);
            expect(this.controller.activities).toEqual(this.response.data.activities);
            expect(this.controller.entities).toEqual(this.response.data.entities);
            expect(this.controller.totalSize).toEqual(this.headers['x-total-count']);
            expect(this.controller.currentPage).toEqual(1);
            expect(this.controller.limit).toEqual(50);
            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        describe('should get a page of Activities', function() {
            it('successfully', function() {
                provManagerSvc.getActivities.and.returnValue($q.when(this.response));
                this.controller.getPage();
                scope.$apply();
                expect(provManagerSvc.getActivities).toHaveBeenCalledWith({pageIndex: this.controller.currentPage - 1, limit: this.controller.limit}, this.controller.id);
                expect(this.controller.activities).toEqual(this.response.data.activities);
                expect(this.controller.entities).toEqual(this.response.data.entities);
                expect(this.controller.totalSize).toEqual(this.headers['x-total-count']);
            });
            it('unless an error occurs', function() {
                provManagerSvc.getActivities.and.returnValue($q.reject('Error message'));
                this.controller.getPage();
                scope.$apply();
                expect(provManagerSvc.getActivities).toHaveBeenCalledWith({pageIndex: this.controller.currentPage - 1, limit: this.controller.limit}, this.controller.id);
            });
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
            expect(this.element.hasClass('activity-list')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(this.element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toBe(1);
        });
        it('depending on how many activities there are', function() {
            expect(this.element.querySelectorAll('block-content .activity').length).toBe(this.controller.activities.length);
        });
    });
});
