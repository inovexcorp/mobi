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
    var $compile, scope, discoverStateSvc, exploreSvc, utilSvc, $q;

    beforeEach(function() {
        module('templates');
        module('instanceCards');
        mockDiscoverState();
        mockExplore();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_, _exploreService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            utilSvc = _utilService_;
            $q = _$q_;
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
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-cards')).toBe(true);
            expect(this.element.hasClass('class-cards')).toBe(true);
            expect(this.element.hasClass('full-height')).toBe(true);
        });
        it('with a .rows-container.full-height', function() {
            expect(this.element.querySelectorAll('.rows-container.full-height').length).toBe(1);
        });
        it('with a .row', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(2);
        });
        it('with a .col-xs-4.card-container', function() {
            expect(this.element.querySelectorAll('.col-xs-4.card-container').length).toBe(4);
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
            it('resolved', function() {
                var data = {'@id': 'instanceId'};
                var item = {instanceIRI: 'instanceId', title: 'title'};
                discoverStateSvc.explore.breadcrumbs = ['', ''];
                exploreSvc.getInstance.and.returnValue($q.when(data));
                this.controller.view(item);
                scope.$apply();
                expect(exploreSvc.getInstance).toHaveBeenCalledWith('recordId', 'instanceId');
                expect(discoverStateSvc.explore.instance.entity).toEqual(data);
                expect(discoverStateSvc.explore.instance.metadata).toEqual(item);
                expect(discoverStateSvc.explore.breadcrumbs).toEqual(['', '', 'title']);
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
            describe('resolved and getClassInstanceDetails is', function() {
                beforeEach(function() {
                    exploreSvc.deleteInstance.and.returnValue($q.when());
                });
                it('resolved', function() {
                    var data = [{
                        instanceIRI: 'id',
                        title: 'title'
                    }, {
                        instanceIRI: 'id2'
                    }, {
                        instanceIRI: 'id3'
                    }, {
                        instanceIRI: 'id4'
                    }];
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.when({data: data}));
                    discoverStateSvc.explore.instanceDetails.limit = 1;
                    this.controller.delete();
                    scope.$apply();
                    expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'id');
                    expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {});
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual([data[0]]);
                    expect(this.controller.showDeleteOverlay).toBe(false);
                });
                it('rejected', function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                    this.controller.delete();
                    scope.$apply();
                    expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'id');
                    expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Instance was successfully deleted.');
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {});
                    expect(this.controller.error).toBe('error');
                });
            });
            it('rejected', function() {
                exploreSvc.deleteInstance.and.returnValue($q.reject('error'));
                this.controller.delete();
                scope.$apply();
                expect(exploreSvc.deleteInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'id');
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