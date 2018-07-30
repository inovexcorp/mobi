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
describe('Instance Block directive', function() {
    var $compile, scope, discoverStateSvc, $httpBackend, exploreSvc, utilSvc, uuid, splitIRI;

    beforeEach(function() {
        module('templates');
        module('instanceBlock');
        mockDiscoverState();
        mockExplore();
        mockUtil();
        injectSplitIRIFilter();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _$httpBackend_, _exploreService_, _utilService_, _uuid_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            $httpBackend = _$httpBackend_;
            exploreSvc = _exploreService_;
            utilSvc = _utilService_;
            uuid = _uuid_;
            splitIRI = _splitIRIFilter_;
        });

        this.element = $compile(angular.element('<instance-block></instance-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        $httpBackend = null;
        exploreSvc = null;
        utilSvc = null;
        uuid = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(this.element.find('breadcrumbs').length).toBe(1);
        });
        it('with a button', function() {
            expect(this.element.find('button').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.querySelectorAll('block-content').length).toBe(1);
        });
        it('with a instance-cards', function() {
            expect(this.element.find('instance-cards').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details.float-left', function() {
            expect(this.element.querySelectorAll('paging-details.float-left').length).toBe(1);
        });
        it('with a pagination.float-right', function() {
            expect(this.element.querySelectorAll('pagination.float-right').length).toBe(1);
        });
        it('with a paging-details.float-left', function() {
            expect(this.element.querySelectorAll('paging-details.float-left').length).toBe(1);
        });
        it('with a pagination.float-right', function() {
            expect(this.element.querySelectorAll('pagination.float-right').length).toBe(1);
        });
    });

    describe('controller methods', function() {
        describe('getPage should hit the correct endpoint when direction is', function() {
            beforeEach(function() {
                this.nextLink = 'http://mobi.com/next';
                this.prevLink = 'http://mobi.com/prev';
                discoverStateSvc.explore.instanceDetails.links = {
                    next: this.nextLink,
                    prev: this.prevLink
                }
                exploreSvc.createPagedResultsObject.and.returnValue({prop: 'paged', currentPage: 0});
            });
            describe('next and get', function() {
                it('succeeds', function() {
                    $httpBackend.expectGET(this.nextLink).respond(200, [{}]);
                    this.controller.getPage('next');
                    flushAndVerify($httpBackend);
                    expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith(jasmine.objectContaining({status: 200, data: [{}]}));
                    expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({prop: 'paged', currentPage: 1}));
                });
                it('fails', function() {
                    $httpBackend.expectGET(this.nextLink).respond(400, null, null, 'error');
                    this.controller.getPage('next');
                    flushAndVerify($httpBackend);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            describe('prev and get', function() {
                it('succeeds', function() {
                    $httpBackend.expectGET(this.prevLink).respond(200, [{}]);
                    this.controller.getPage('prev');
                    flushAndVerify($httpBackend);
                    expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith(jasmine.objectContaining({status: 200, data: [{}]}));
                    expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({prop: 'paged', currentPage: -1}));
                });
                it('fails', function() {
                    $httpBackend.expectGET(this.prevLink).respond(400, null, null, 'error');
                    this.controller.getPage('prev');
                    flushAndVerify($httpBackend);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
        });
        it('create should set the correct variables', function() {
            discoverStateSvc.explore.creating = false;
            discoverStateSvc.explore.instanceDetails.data = [{instanceIRI: 'instanceIRI'}];
            discoverStateSvc.explore.classId = 'classId';
            splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
            this.controller.create();
            expect(discoverStateSvc.explore.creating).toBe(true);
            expect(splitIRI).toHaveBeenCalledWith('instanceIRI');
            expect(uuid.v4).toHaveBeenCalled();
            expect(discoverStateSvc.explore.instance.entity[0]['@id']).toContain('begin/');
            expect(discoverStateSvc.explore.instance.entity[0]['@type']).toEqual(['classId']);
            expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('New Instance');
            expect(discoverStateSvc.explore.instance.metadata.instanceIRI).toEqual('begin/');
        });
        it('getClassName should return the correct value', function() {
            discoverStateSvc.explore.breadcrumbs = ['not-this', 'class'];
            expect(this.controller.getClassName()).toBe('class');
        });
        it('button should say [Deprecated] if the class is deprecated', function() {
            expect(angular.element(this.element.find('button')[0]).text().trim()).not.toContain('[Deprecated]');
            discoverStateSvc.explore.classDeprecated = true;
            scope.$apply();
            expect(angular.element(this.element.find('button')[0]).text().trim()).toContain('[Deprecated]');
        });
    });
});