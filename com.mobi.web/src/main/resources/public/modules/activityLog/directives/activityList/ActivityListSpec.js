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

        this.nextLink = 'http://example.com/next';
        this.prevLink = 'http://example.com/prev';
        this.headers = {
            'x-total-count': 2,
            link: ''
        };
        this.response = {
            data: {
                activities: [{'@id': 'activity1'}, {'@id': 'activity2'}],
                entities: [{'@id': 'entity1'}]
            },
            headers: jasmine.createSpy('headers').and.returnValue(this.headers)
        };

        provManagerSvc.getActivities.and.returnValue($q.when(this.response));
        utilSvc.parseLinks.and.returnValue({next: this.nextLink, prev: this.prevLink});
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
            expect(provManagerSvc.getActivities).toHaveBeenCalledWith(this.controller.paginatedConfig, this.controller.id);
            expect(utilSvc.parseLinks).not.toHaveBeenCalled();
            expect(this.controller.activities).toEqual([]);
            expect(this.controller.entities).toEqual([]);
            expect(this.controller.totalSize).toEqual(0);
            expect(this.controller.paginatedConfig).toEqual({limit: 50, pageIndex: 0});
            expect(this.controller.links).toEqual({prev: '', next: ''});
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
        });
        it('successfully', function() {
            this.compile();
            expect(provManagerSvc.getActivities).toHaveBeenCalledWith(this.controller.paginatedConfig, this.controller.id);
            expect(utilSvc.parseLinks).toHaveBeenCalledWith(this.headers.link);
            expect(this.controller.activities).toEqual(this.response.data.activities);
            expect(this.controller.entities).toEqual(this.response.data.entities);
            expect(this.controller.totalSize).toEqual(this.headers['x-total-count']);
            expect(this.controller.paginatedConfig).toEqual({limit: 50, pageIndex: 0});
            expect(this.controller.links).toEqual({prev: this.prevLink, next: this.nextLink});
            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        describe('should get a page of Activities', function() {
            beforeEach(function() {
                this.index = this.controller.paginatedConfig.pageIndex;
                utilSvc.parseLinks.and.returnValue({});
                utilSvc.parseLinks.calls.reset();
            });
            describe('successfully', function() {
                beforeEach(function() {
                    utilSvc.getResultsPage.and.returnValue($q.when(this.response));
                });
                it('if the direction is previous', function() {
                    this.controller.getPage('prev');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith(this.prevLink, utilSvc.rejectError, this.controller.id);
                    expect(utilSvc.parseLinks).toHaveBeenCalledWith(this.headers.link);
                    expect(this.controller.paginatedConfig.pageIndex).toBe(this.index - 1);
                    expect(this.controller.activities).toEqual(this.response.data.activities);
                    expect(this.controller.entities).toEqual(this.response.data.entities);
                    expect(this.controller.totalSize).toEqual(this.headers['x-total-count']);
                    expect(this.controller.links).toEqual({prev: '', next: ''});
                });
                it('if the direction is next', function() {
                    this.controller.getPage('next');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith(this.nextLink, utilSvc.rejectError, this.controller.id);
                    expect(utilSvc.parseLinks).toHaveBeenCalledWith(this.headers.link);
                    expect(this.controller.paginatedConfig.pageIndex).toBe(this.index + 1);
                    expect(this.controller.activities).toEqual(this.response.data.activities);
                    expect(this.controller.entities).toEqual(this.response.data.entities);
                    expect(this.controller.totalSize).toEqual(this.headers['x-total-count']);
                    expect(this.controller.links).toEqual({prev: '', next: ''});
                });
            });
            describe('unless an error occurs', function() {
                beforeEach(function() {
                    utilSvc.getResultsPage.and.returnValue($q.reject('Error message'));
                });
                it('and the direction was previous', function() {
                    this.controller.getPage('prev');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith(this.prevLink, utilSvc.rejectError, this.controller.id);
                    expect(utilSvc.parseLinks).not.toHaveBeenCalled();
                });
                it('and the direction was next', function() {
                    this.controller.getPage('next');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith(this.nextLink, utilSvc.rejectError, this.controller.id);
                    expect(utilSvc.parseLinks).not.toHaveBeenCalled();
                });
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
            expect(this.element.querySelectorAll('.col-xs-8').length).toBe(1);
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
