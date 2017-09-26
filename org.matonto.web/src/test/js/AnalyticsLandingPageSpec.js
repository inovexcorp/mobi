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
describe('Analytics Landing Page directive', function() {
    var $compile, $q, scope, element, controller, catalogManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('analyticsLandingPage');
        mockCatalogManager();
        mockPrefixes();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _$q_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            $q = _$q_;
            utilSvc = _utilService_;
        });
        
        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        catalogManagerSvc.getRecords.and.returnValue($q.when({
            data: [],
            headers: jasmine.createSpy('headers').and.returnValue({
                'x-total-count': 10,
                link: 'link'
            })
        }));
        element = $compile(angular.element('<analytics-landing-page></analytics-landing-page>'))(scope);
        scope.$digest();
        controller = element.controller('analyticsLandingPage');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('analytics-landing-page')).toBe(true);
            expect(element.hasClass('full-height')).toBe(true);
            expect(element.hasClass('clearfix')).toBe(true);
        });
        it('with a .blue-bar', function() {
            expect(element.querySelectorAll('.blue-bar').length).toBe(1);
        });
        it('with a .white-bar', function() {
            expect(element.querySelectorAll('.white-bar').length).toBe(1);
        });
        it('with a .form-inline', function() {
            expect(element.querySelectorAll('.form-inline').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a .input-group', function() {
            expect(element.querySelectorAll('.input-group').length).toBe(1);
        });
        it('with a .form-control', function() {
            expect(element.querySelectorAll('.form-control').length).toBe(1);
        });
        it('with a .input-group-btn', function() {
            expect(element.querySelectorAll('.input-group-btn').length).toBe(1);
        });
        it('with .btn-primarys', function() {
            expect(element.querySelectorAll('.btn-primary').length).toBe(2);
        });
        it('with a .row', function() {
            expect(element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a .col-xs-8', function() {
            expect(element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a info-message', function() {
            expect(element.find('info-message').length).toBe(1);
            controller.records = [{'@id': 'recordId'}];
            scope.$apply();
            expect(element.find('info-message').length).toBe(0);
        });
        it('with a md-list', function() {
            expect(element.find('md-list').length).toBe(1);
        });
        it('with md-list-items', function() {
            expect(element.find('md-list-item').length).toBe(0);
            controller.records = [{'@id': 'recordId'}, {'@id': 'recordId2'}];
            scope.$apply();
            expect(element.find('md-list-item').length).toBe(2);
        });
        it('with a block-footer', function() {
            expect(element.find('block-footer').length).toBe(0);
            controller.records = [{'@id': 'recordId'}, {'@id': 'recordId2'}];
            scope.$apply();
            expect(element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(element.find('paging-details').length).toBe(0);
            controller.records = [{'@id': 'recordId'}, {'@id': 'recordId2'}];
            scope.$apply();
            expect(element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(element.find('pagination').length).toBe(0);
            controller.records = [{'@id': 'recordId'}, {'@id': 'recordId2'}];
            scope.$apply();
            expect(element.find('pagination').length).toBe(1);
        });
        it('with a new-analytic-overlay', function() {
            expect(element.find('new-analytic-overlay').length).toBe(0);
            controller.showOverlay = true;
            scope.$apply();
            expect(element.find('new-analytic-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('getAnalyticRecords should set the correct variables when getRecords', function() {
            it('resolves', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.when({
                    data: [{'@id': 'recordId'}],
                    headers: jasmine.createSpy('headers').and.returnValue({
                        'x-total-count': 10,
                        link: 'link'
                    })
                }));
                utilSvc.parseLinks.and.returnValue({next: 'next', prev: 'prev'});
                controller.config.pageIndex = 1;
                controller.getAnalyticRecords();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith('catalogId', controller.config);
                expect(controller.config.pageIndex).toEqual(0);
                expect(controller.records).toEqual([{'@id': 'recordId'}]);
                expect(controller.paging.total).toBe(10);
                expect(utilSvc.parseLinks).toHaveBeenCalledWith('link');
                expect(controller.paging.links).toEqual({next: 'next', prev: 'prev'});
            });
            it('rejects', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('error'));
                controller.getAnalyticRecords();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith('catalogId', controller.config);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        describe('getPage should set the correct variables when getResultsPage', function() {
            beforeEach(function() {
                controller.config.pageIndex = 1;
                controller.paging.links = {
                    next: 'next',
                    prev: 'prev'
                };
            });
            describe('resolves and direction is', function() {
                beforeEach(function() {
                    utilSvc.getResultsPage.and.returnValue($q.when({
                        data: [{'@id': 'recordId'}],
                        headers: jasmine.createSpy('headers').and.returnValue({
                            'x-total-count': 10,
                            link: 'link'
                        })
                    }));
                    utilSvc.parseLinks.and.returnValue({next: 'next', prev: 'prev'});
                });
                it('next', function() {
                    controller.getPage('next');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith('next');
                    expect(controller.config.pageIndex).toEqual(2);
                    expect(controller.records).toEqual([{'@id': 'recordId'}]);
                    expect(controller.paging.total).toBe(10);
                    expect(utilSvc.parseLinks).toHaveBeenCalledWith('link');
                    expect(controller.paging.links).toEqual({next: 'next', prev: 'prev'});
                });
                it('prev', function() {
                    controller.getPage('prev');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith('prev');
                    expect(controller.config.pageIndex).toEqual(0);
                    expect(controller.records).toEqual([{'@id': 'recordId'}]);
                    expect(controller.paging.total).toBe(10);
                    expect(utilSvc.parseLinks).toHaveBeenCalledWith('link');
                    expect(controller.paging.links).toEqual({next: 'next', prev: 'prev'});
                });
            });
            it('rejects', function() {
                utilSvc.getResultsPage.and.returnValue($q.reject('error'));
                controller.getPage('next');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith('next');
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
    });
});