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
    var $compile, scope, element, discoverStateSvc, $httpBackend, exploreSvc, controller, utilSvc, uuid, splitIRI;

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
        
        element = $compile(angular.element('<instance-block></instance-block>'))(scope);
        scope.$digest();
        controller = element.controller('instanceBlock');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(element.find('breadcrumbs').length).toBe(1);
        });
        it('with a button', function() {
            expect(element.find('button').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.querySelectorAll('block-content').length).toBe(1);
        });
        it('with a instance-cards', function() {
            expect(element.find('instance-cards').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details.pull-left', function() {
            expect(element.querySelectorAll('paging-details.pull-left').length).toBe(1);
        });
        it('with a pagination.pull-right', function() {
            expect(element.querySelectorAll('pagination.pull-right').length).toBe(1);
        });
    });
    
    describe('controller methods', function() {
        describe('getPage should hit the correct endpoint when direction is', function() {
            var nextLink = 'http://mobi.com/next';
            var prevLink = 'http://mobi.com/prev';
            beforeEach(function() {
                discoverStateSvc.explore.instanceDetails.links = {
                    next: nextLink,
                    prev: prevLink
                }
                exploreSvc.createPagedResultsObject.and.returnValue({prop: 'paged', currentPage: 0});
            });
            describe('next and get', function() {
                it('succeeds', function() {
                    $httpBackend.expectGET(nextLink).respond(200, [{}]);
                    controller.getPage('next');
                    flushAndVerify($httpBackend);
                    expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith(jasmine.objectContaining({status: 200, data: [{}]}));
                    expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({prop: 'paged', currentPage: 1}));
                });
                it('fails', function() {
                    $httpBackend.expectGET(nextLink).respond(400, null, null, 'error');
                    controller.getPage('next');
                    flushAndVerify($httpBackend);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            describe('prev and get', function() {
                it('succeeds', function() {
                    $httpBackend.expectGET(prevLink).respond(200, [{}]);
                    controller.getPage('prev');
                    flushAndVerify($httpBackend);
                    expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith(jasmine.objectContaining({status: 200, data: [{}]}));
                    expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({prop: 'paged', currentPage: -1}));
                });
                it('fails', function() {
                    $httpBackend.expectGET(prevLink).respond(400, null, null, 'error');
                    controller.getPage('prev');
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
            controller.create();
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
            expect(controller.getClassName()).toBe('class');
        });
        it('button should say [Deprecated] if the class is deprecated', function() {
            expect(angular.element(element.find('button')[0]).text().trim()).not.toContain('[Deprecated]');
            discoverStateSvc.explore.classDeprecated = true;
            scope.$apply();
            expect(angular.element(element.find('button')[0]).text().trim()).toContain('[Deprecated]');
        });
    });
});