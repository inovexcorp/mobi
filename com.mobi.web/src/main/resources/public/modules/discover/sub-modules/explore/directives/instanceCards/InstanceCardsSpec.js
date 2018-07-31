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
describe('Instance Cards directive', function() {
    var $compile, scope, discoverStateSvc, exploreSvc, utilSvc, $q, exploreUtilsSvc;

    beforeEach(function() {
        module('templates');
        module('instanceCards');
        mockDiscoverState();
        mockExplore();
        mockUtil();
        mockExploreUtils();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _exploreService_, _utilService_, _$q_, _exploreUtilsService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            utilSvc = _utilService_;
            $q = _$q_;
            exploreUtilsSvc = _exploreUtilsService_;
        });

        discoverStateSvc.explore.recordId = 'recordId';
        discoverStateSvc.explore.instanceDetails.data = [{
            title: 'y'
        }, {
            title: 'z'
        }, {
            title: 'b'
        }, {
            title: 'a'
        }];
        this.element = $compile(angular.element('<instance-cards></instance-cards>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceCards');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        exploreSvc = null;
        utilSvc = null;
        $q = null;
        exploreUtilsSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-cards')).toBe(true);
            expect(this.element.hasClass('class-cards')).toBe(true);
            expect(this.element.hasClass('h-100')).toBe(true);
        });
        it('with a .rows-container.h-100', function() {
            expect(this.element.querySelectorAll('.rows-container.h-100').length).toBe(1);
        });
        it('with a .row', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(2);
        });
        it('with a .col-4.card-container', function() {
            expect(this.element.querySelectorAll('.col-4.card-container').length).toBe(4);
        });
        it('with a md-card', function() {
            expect(this.element.find('md-card').length).toBe(4);
        });
        it('with a md-card-title', function() {
            expect(this.element.find('md-card-title').length).toBe(4);
        });
        it('with a md-card-title-text', function() {
            expect(this.element.find('md-card-title-text').length).toBe(4);
        });
        it('with a .card-header', function() {
            expect(this.element.querySelectorAll('.card-header').length).toBe(4);
        });
        it('with a .md-headline.text', function() {
            expect(this.element.querySelectorAll('.md-headline.text').length).toBe(4);
        });
        it('with a md-card-content', function() {
            expect(this.element.find('md-card-content').length).toBe(4);
        });
        it('with a .overview', function() {
            expect(this.element.querySelectorAll('.overview').length).toBe(4);
        });
        it('with a md-card-actions', function() {
            expect(this.element.find('md-card-actions').length).toBe(4);
        });
        it('with a md-button', function() {
            expect(this.element.find('md-button').length).toBe(8);
        });
        it('with a confirmation-overlay', function() {
            expect(this.element.find('confirmation-overlay').length).toBe(0);
            this.controller.showDeleteOverlay = true;
            scope.$apply();
            expect(this.element.find('confirmation-overlay').length).toBe(1);
        });
    });
    it('properly defines controller.chunks on load', function() {
        var expected = [[{
            title: 'a'
        }, {
            title: 'b'
        }, {
            title: 'y'
        }], [{
            title: 'z'
        }]];
        expect(angular.copy(this.controller.chunks)).toEqual(expected);
    });
    describe('controller methods', function() {
        describe('view should set the correct variables when getInstance is', function() {
            describe('resolved and getReferencedTitles is', function() {
                beforeEach(function() {
                    this.data = [{'@id': 'instanceId'}];
                    this.item = {instanceIRI: 'instanceId', title: 'title'};
                    discoverStateSvc.explore.breadcrumbs = ['', ''];
                    exploreSvc.getInstance.and.returnValue($q.when(this.data));
                });
                it('resolved', function() {
                    exploreUtilsSvc.getReferencedTitles.and.returnValue($q.when({
                        results: {
                            bindings: [{
                                object: {value: 'object'},
                                title: {value: 'title'}
                            }]
                        }
                    }));
                    this.controller.view(this.item);
                    scope.$apply();
                    expect(exploreSvc.getInstance).toHaveBeenCalledWith('recordId', 'instanceId');
                    expect(discoverStateSvc.explore.instance.entity).toEqual(this.data);
                    expect(discoverStateSvc.explore.instance.metadata).toEqual(this.item);
                    expect(discoverStateSvc.explore.breadcrumbs).toEqual(['', '', 'title']);
                    expect(discoverStateSvc.explore.instance.objectMap).toEqual({object: 'title'});
                });
                it('rejected', function() {
                    exploreUtilsSvc.getReferencedTitles.and.returnValue($q.reject('error'));
                    this.controller.view(this.item);
                    scope.$apply();
                    expect(exploreSvc.getInstance).toHaveBeenCalledWith('recordId', 'instanceId');
                    expect(discoverStateSvc.explore.instance.entity).toEqual(this.data);
                    expect(discoverStateSvc.explore.instance.metadata).toEqual(this.item);
                    expect(discoverStateSvc.explore.breadcrumbs).toEqual(['', '', 'title']);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('rejected', function() {
                exploreSvc.getInstance.and.returnValue($q.reject('error'));
                this.controller.view({instanceIRI: 'instanceId', title: 'title'});
                scope.$apply();
                expect(exploreSvc.getInstance).toHaveBeenCalledWith('recordId', 'instanceId');
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        describe('delete should call the correct methods when deleteInstance is', function() {
            beforeEach(function() {
                this.controller.selectedItem = {instanceIRI: 'id'};
            });
            describe('resolved and', function() {
                beforeEach(function() {
                    exploreSvc.deleteInstance.and.returnValue($q.when());
                        discoverStateSvc.explore.instanceDetails.limit = 1;
                });
                describe('there are no more instances and getClassDetails is', function() {
                    beforeEach(function() {
                        discoverStateSvc.explore.instanceDetails.total = 1;
                    });
                    it('resolved', function() {
                        exploreSvc.getClassDetails.and.returnValue($q.when([{}]));
                        this.controller.delete();
                        scope.$apply();
                        expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.controller.selectedItem.instanceIRI);
                        expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                        expect(exploreSvc.getClassDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId);
                        expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                        expect(discoverStateSvc.explore.classDetails).toEqual([{}]);
                        expect(discoverStateSvc.clickCrumb).toHaveBeenCalledWith(0);
                        expect(this.controller.showDeleteOverlay).toBe(false);
                    });
                    it('rejected', function() {
                        exploreSvc.getClassDetails.and.returnValue($q.reject('error'));
                        this.controller.delete();
                        scope.$apply();
                        expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.controller.selectedItem.instanceIRI);
                        expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                        expect(exploreSvc.getClassDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId);
                        expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                        expect(discoverStateSvc.explore.classDetails).not.toEqual([{}]);
                        expect(discoverStateSvc.clickCrumb).not.toHaveBeenCalled();
                        expect(this.controller.error).toBe('error');
                    });
                });
                describe('there are more instances and getClassInstanceDetails is', function() {
                    beforeEach(function() {
                        discoverStateSvc.explore.instanceDetails.total = 5;
                        discoverStateSvc.explore.instanceDetails.currentPage = 1;
                    });
                    describe('resolved and the instance', function() {
                        beforeEach(function() {
                            this.resultsObject = {data: [{ instanceIRI: 'id2'}], links: {prev: 'prev', next: 'next'}};
                            exploreSvc.getClassInstanceDetails.and.returnValue($q.when({}));
                            exploreSvc.createPagedResultsObject.and.returnValue(this.resultsObject);
                        });
                        it('was the only one on the page', function() {
                            discoverStateSvc.explore.instanceDetails.data = [{}];
                            this.controller.delete();
                            scope.$apply();
                            expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.controller.selectedItem.instanceIRI);
                            expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                            expect(exploreSvc.getClassDetails).not.toHaveBeenCalled();
                            expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: 0, limit: 1});
                            expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith({});
                            expect(discoverStateSvc.explore.instanceDetails.data).toEqual(this.resultsObject.data);
                            expect(discoverStateSvc.explore.instanceDetails.links).toEqual(this.resultsObject.links);
                            expect(discoverStateSvc.explore.instanceDetails.total).toBe(4);
                            expect(discoverStateSvc.explore.instanceDetails.currentPage).toBe(0);
                            expect(this.controller.showDeleteOverlay).toBe(false);
                        });
                        it('was not the only one on the page', function() {
                            discoverStateSvc.explore.instanceDetails.data = [{}, {}];
                            this.controller.delete();
                            scope.$apply();
                            expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.controller.selectedItem.instanceIRI);
                            expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                            expect(exploreSvc.getClassDetails).not.toHaveBeenCalled();
                            expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: 1, limit: 1});
                            expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith({});
                            expect(discoverStateSvc.explore.instanceDetails.data).toEqual(this.resultsObject.data);
                            expect(discoverStateSvc.explore.instanceDetails.links).toEqual(this.resultsObject.links);
                            expect(discoverStateSvc.explore.instanceDetails.total).toBe(4);
                            expect(discoverStateSvc.explore.instanceDetails.currentPage).toBe(1);
                            expect(this.controller.showDeleteOverlay).toBe(false);
                        });
                    });
                    it('rejected', function() {
                        exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                        this.controller.delete();
                        scope.$apply();
                        expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'id');
                        expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                        expect(exploreSvc.getClassDetails).not.toHaveBeenCalled();
                        expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: 1, limit: 1});
                        expect(this.controller.error).toBe('error');
                    });
                });
            });
            it('rejected', function() {
                exploreSvc.deleteInstance.and.returnValue($q.reject('error'));
                this.controller.delete();
                scope.$apply();
                expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'id');
                expect(exploreSvc.getClassDetails).not.toHaveBeenCalled();
                expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(this.controller.error).toBe('error');
            });
        });
        it('showOverlay should set the correct variables', function() {
            this.controller.showOverlay({prop: 'id'});
            expect(this.controller.selectedItem).toEqual({prop: 'id'});
            expect(this.controller.showDeleteOverlay).toBe(true);
        });
    });
});