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
describe('Analytics Landing Page directive', function() {
    var $compile, $q, scope, catalogManagerSvc, utilSvc, analyticStateSvc, analyticManagerSvc;

    beforeEach(function() {
        module('templates');
        module('analyticsLandingPage');
        mockAnalyticManager();
        mockAnalyticState();
        mockCatalogManager();
        mockPrefixes();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _$q_, _utilService_, _analyticStateService_, _analyticManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            $q = _$q_;
            utilSvc = _utilService_;
            analyticStateSvc = _analyticStateService_;
            analyticManagerSvc = _analyticManagerService_;
        });

        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        catalogManagerSvc.getRecords.and.returnValue($q.when({
            data: [],
            headers: jasmine.createSpy('headers').and.returnValue({
                'x-total-count': 10,
                link: 'link'
            })
        }));
        this.element = $compile(angular.element('<analytics-landing-page></analytics-landing-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('analyticsLandingPage');
    });

    afterEach(function() {
        $compile = null;
        $q = null;
        scope = null;
        catalogManagerSvc = null;
        utilSvc = null;
        analyticStateSvc = null;
        analyticManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('analytics-landing-page')).toBe(true);
            expect(this.element.hasClass('full-height')).toBe(true);
            expect(this.element.hasClass('clearfix')).toBe(true);
        });
        it('with a .blue-bar', function() {
            expect(this.element.querySelectorAll('.blue-bar').length).toBe(1);
        });
        it('with a .white-bar', function() {
            expect(this.element.querySelectorAll('.white-bar').length).toBe(1);
        });
        it('with a .form-inline', function() {
            expect(this.element.querySelectorAll('.form-inline').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a .input-group', function() {
            expect(this.element.querySelectorAll('.input-group').length).toBe(1);
        });
        it('with a .form-control', function() {
            expect(this.element.querySelectorAll('.form-control').length).toBe(1);
        });
        it('with a .input-group-btn', function() {
            expect(this.element.querySelectorAll('.input-group-btn').length).toBe(1);
        });
        it('with .btn-primarys', function() {
            expect(this.element.querySelectorAll('.btn-primary').length).toBe(2);
        });
        it('with a .row', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a .col-8', function() {
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a info-message', function() {
            expect(this.element.find('info-message').length).toBe(1);
            this.controller.records = [{'@id': 'recordId'}];
            scope.$apply();
            expect(this.element.find('info-message').length).toBe(0);
        });
        it('with a md-list', function() {
            expect(this.element.find('md-list').length).toBe(1);
        });
        it('with md-list-items', function() {
            expect(this.element.find('md-list-item').length).toBe(0);
            this.controller.records = [{'@id': 'recordId'}, {'@id': 'recordId2'}];
            scope.$apply();
            expect(this.element.find('md-list-item').length).toBe(2);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(0);
            this.controller.records = [{'@id': 'recordId'}, {'@id': 'recordId2'}];
            scope.$apply();
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(this.element.find('paging-details').length).toBe(0);
            this.controller.records = [{'@id': 'recordId'}, {'@id': 'recordId2'}];
            scope.$apply();
            expect(this.element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toBe(0);
            this.controller.records = [{'@id': 'recordId'}, {'@id': 'recordId2'}];
            scope.$apply();
            expect(this.element.find('pagination').length).toBe(1);
        });
        it('with a new-analytic-overlay', function() {
            expect(this.element.find('new-analytic-overlay').length).toBe(0);
            this.controller.showCreateOverlay = true;
            scope.$apply();
            expect(this.element.find('new-analytic-overlay').length).toBe(1);
        });
        it('with a confirmation-overlay', function() {
            expect(this.element.find('confirmation-overlay').length).toBe(0);
            this.controller.showDeleteOverlay = true;
            scope.$apply();
            expect(this.element.find('confirmation-overlay').length).toBe(1);
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
                this.controller.config.pageIndex = 1;
                this.controller.getAnalyticRecords();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith('catalogId', this.controller.config);
                expect(this.controller.config.pageIndex).toEqual(0);
                expect(this.controller.records).toEqual([{'@id': 'recordId'}]);
                expect(this.controller.paging.total).toBe(10);
                expect(utilSvc.parseLinks).toHaveBeenCalledWith('link');
                expect(this.controller.paging.links).toEqual({next: 'next', prev: 'prev'});
            });
            it('rejects', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('error'));
                this.controller.getAnalyticRecords();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith('catalogId', this.controller.config);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        describe('getPage should set the correct variables when getResultsPage', function() {
            beforeEach(function() {
                this.controller.config.pageIndex = 1;
                this.controller.paging.links = {
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
                    this.controller.getPage('next');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith('next');
                    expect(this.controller.config.pageIndex).toEqual(2);
                    expect(this.controller.records).toEqual([{'@id': 'recordId'}]);
                    expect(this.controller.paging.total).toBe(10);
                    expect(utilSvc.parseLinks).toHaveBeenCalledWith('link');
                    expect(this.controller.paging.links).toEqual({next: 'next', prev: 'prev'});
                });
                it('prev', function() {
                    this.controller.getPage('prev');
                    scope.$apply();
                    expect(utilSvc.getResultsPage).toHaveBeenCalledWith('prev');
                    expect(this.controller.config.pageIndex).toEqual(0);
                    expect(this.controller.records).toEqual([{'@id': 'recordId'}]);
                    expect(this.controller.paging.total).toBe(10);
                    expect(utilSvc.parseLinks).toHaveBeenCalledWith('link');
                    expect(this.controller.paging.links).toEqual({next: 'next', prev: 'prev'});
                });
            });
            it('rejects', function() {
                utilSvc.getResultsPage.and.returnValue($q.reject('error'));
                this.controller.getPage('next');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith('next');
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        describe('open should call the correct functions when getAnalytic', function() {
            describe('resolves and populateEditor', function() {
                beforeEach(function() {
                    analyticManagerSvc.getAnalytic.and.returnValue($q.when([]));
                });
                describe('resolves and the response is', function() {
                    it('empty', function() {
                        analyticStateSvc.populateEditor.and.returnValue($q.when());
                        this.controller.open('recordId');
                        scope.$apply();
                        expect(analyticManagerSvc.getAnalytic).toHaveBeenCalledWith('recordId');
                        expect(analyticStateSvc.populateEditor).toHaveBeenCalled();
                        expect(analyticStateSvc.showEditor).toHaveBeenCalled();
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    });
                    it('populated', function() {
                        analyticStateSvc.populateEditor.and.returnValue($q.when('message'));
                        this.controller.open('recordId');
                        scope.$apply();
                        expect(analyticManagerSvc.getAnalytic).toHaveBeenCalledWith('recordId');
                        expect(analyticStateSvc.populateEditor).toHaveBeenCalled();
                        expect(analyticStateSvc.showEditor).toHaveBeenCalled();
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('message');
                    });
                });
                it('rejects', function() {
                    analyticStateSvc.populateEditor.and.returnValue($q.reject('error'));
                    this.controller.open('recordId');
                    scope.$apply();
                    expect(analyticManagerSvc.getAnalytic).toHaveBeenCalledWith('recordId');
                    expect(analyticStateSvc.populateEditor).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('rejects', function() {
                analyticManagerSvc.getAnalytic.and.returnValue($q.reject('error'));
                this.controller.open('recordId');
                scope.$apply();
                expect(analyticManagerSvc.getAnalytic).toHaveBeenCalledWith('recordId');
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('showDeleteConfirmation should set the correct variables when passed a valid index.', function() {
            this.controller.showDeleteConfirmation(2);
            scope.$apply();
            expect(this.controller.recordIndex).toEqual(2)
            expect(this.controller.errorMessage).toBe('');
            expect(this.controller.showDeleteOverlay).toBe(true);
        });
        describe('deleteRecord should set the correct variables', function() {
            beforeEach(function() {
                this.controller.records = [{'@id': 'zero', title: 'zero'}];
                this.controller.recordIndex = 0;
                this.controller.showDeleteOverlay = true;
            });
            it('when record deletion fails.', function() {
                catalogManagerSvc.deleteRecord.and.returnValue($q.reject('error'));
                this.controller.deleteRecord();
                scope.$apply();
                expect(this.controller.recordIndex).toEqual(0);
                expect(this.controller.errorMessage).toBe('error');
                expect(this.element.find('error-display').length).toBe(1);
                expect(this.controller.showDeleteOverlay).toBe(true);
            });
            it('when record deletion succeeds.', function() {
                catalogManagerSvc.deleteRecord.and.returnValue($q.when({}));
                this.controller.deleteRecord();
                scope.$apply();
                expect(catalogManagerSvc.deleteRecord).toHaveBeenCalledWith('zero', 'catalogId');
                expect(this.controller.records).not.toContain({'@id': 'zero', title: 'zero'});
                expect(this.controller.recordIndex).toEqual(-1);
                expect(this.controller.errorMessage).toBeFalsy();
                expect(this.controller.showDeleteOverlay).toBe(false);
            });
        });
    });
});