/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { 
    mockDiscoverState,
    mockUtil,
    mockExploreUtils,
    mockPrefixes,
    mockPolicyEnforcement
} from '../../../../../../../test/js/Shared';

describe('Instance View component', function() {
    var $compile, scope, $q, discoverStateSvc, utilSvc, exploreUtilsSvc, prefixes, policyEnforcementSvc;

    beforeEach(function() {
        angular.mock.module('explore');
        mockDiscoverState();
        mockUtil();
        mockExploreUtils();
        mockPrefixes();
        mockPolicyEnforcement();

        inject(function(_$compile_, _$rootScope_, _$q_, _discoverStateService_, _utilService_, _exploreUtilsService_, _prefixes_, _policyEnforcementService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            discoverStateSvc = _discoverStateService_;
            utilSvc = _utilService_;
            exploreUtilsSvc = _exploreUtilsService_;
            prefixes = _prefixes_;
            policyEnforcementSvc = _policyEnforcementService_;
        });

        discoverStateSvc.getInstance.and.returnValue({
            '@id': 'ignored',
            '@type': ['ignored'],
            prop1: [{
                '@id': 'http://mobi.com/id'
            }],
            prop2: [{
                '@value': 'value1'
            }, {
                '@value': 'value2'
            }]
        });
        discoverStateSvc.explore.instance.metadata.instanceIRI = 'instanceIRI';
        exploreUtilsSvc.getReification.and.callFake(function(arr, sub, pred, value) {
            if (_.isEqual(value, {'@value': 'value1'})) {
                return {prop3: [{'@value': 'value3'}]};
            }
            return undefined;
        });
        this.element = $compile(angular.element('<instance-view></instance-view>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceView');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        discoverStateSvc = null;
        exploreUtilsSvc = null;
        prefixes = null;
        policyEnforcementSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('INSTANCE-VIEW');
        });
        it('for a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(this.element.find('breadcrumbs').length).toBe(1);
        });
        it('with a .float-right.edit-button', function() {
            expect(this.element.querySelectorAll('.float-right.edit-button').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a .row', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a .col-8.offset-2', function() {
            expect(this.element.querySelectorAll('.col-8.offset-2').length).toBe(1);
        });
        it('with a h2', function() {
            expect(this.element.find('h2').length).toBe(1);
        });
        it('with a small', function() {
            expect(this.element.find('small').length).toBe(1);
        });
        it('with three h3.property', function() {
            expect(this.element.querySelectorAll('h3.property').length).toBe(3);
        });
        it('with three ul.values', function() {
            expect(this.element.querySelectorAll('ul.values').length).toBe(3);
        });
        it('with a .values.show-link', function() {
            expect(this.element.querySelectorAll('.values.show-link').length).toBe(1);

            discoverStateSvc.getInstance.and.returnValue({
                '@id': 'ignored',
                '@type': ['ignored'],
                'prop1': [{
                    '@id': 'http://mobi.com/id'
                }]
            });
            this.element = $compile(angular.element('<instance-view></instance-view>'))(scope);
            scope.$digest();

            expect(this.element.querySelectorAll('.values.show-link').length).toBe(0);
        });
        it('with a .values.show-more', function() {
            expect(this.element.querySelectorAll('.values.show-more').length).toBe(0);
            angular.element(this.element.querySelectorAll('.link')[0]).triggerHandler('click');
            expect(this.element.querySelectorAll('.values.show-more').length).toBe(1);
        });
        it('with three li.link-containers', function() {
            expect(this.element.querySelectorAll('li.link-container').length).toBe(3);
        });
        it('with three a.links', function() {
            expect(this.element.querySelectorAll('a.link').length).toBe(3);
        });
        it('with a a.more', function() {
            expect(this.element.querySelectorAll('a.more').length).toBe(0);
            angular.element(this.element.querySelectorAll('.link')[0]).triggerHandler('click');
            expect(this.element.querySelectorAll('a.more').length).toBe(1);
        });
        it('depending on whether reification statements are shown', function() {
            var showReification = angular.element(this.element.querySelectorAll('.show-reification')[0]);
            var icon = angular.element(showReification.children()[0]);
            expect(icon.hasClass('fa-angle-down')).toBe(true);
            expect(icon.hasClass('fa-angle-up')).toBe(false);

            showReification.triggerHandler('click');
            expect(icon.hasClass('fa-angle-down')).toBe(false);
            expect(icon.hasClass('fa-angle-up')).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('getLimit returns the proper value when limit and array.length are', function() {
            it('equal', function() {
                expect(this.controller.getLimit(['', ''], 2)).toBe(1);
            });
            it('not equal', function() {
                expect(this.controller.getLimit(['', ''], 1)).toBe(2);
            });
        });
        it('getReification should retrieve the Statement object for a property value', function() {
            var statement = {
                '@id': 'test',
                '@type': ['Statement'],
                prop3: [{'@value': 'value'}],
            };
            statement[prefixes.rdf + 'subject'] = [{'@id': 'subject'}];
            statement[prefixes.rdf + 'predicate'] = [{'@id': 'predicate'}];
            statement[prefixes.rdf + 'object'] = [{'@value': 'value'}];
            exploreUtilsSvc.getReification.and.returnValue(statement);
            expect(this.controller.getReification('', {})).toEqual({prop3: [{'@value': 'value'}]});
            expect(exploreUtilsSvc.getReification).toHaveBeenCalledWith(discoverStateSvc.explore.instance.entity, discoverStateSvc.explore.instance.metadata.instanceIRI, '', {});

            exploreUtilsSvc.getReification.and.returnValue(undefined);
            expect(this.controller.getReification('', {})).toBeUndefined();
            expect(exploreUtilsSvc.getReification).toHaveBeenCalledWith(discoverStateSvc.explore.instance.entity, discoverStateSvc.explore.instance.metadata.instanceIRI, '', {});
        });
        it('edit sets the correct state and have modify permission', function() {
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
            discoverStateSvc.explore.editing = false;
            discoverStateSvc.explore.instance.original = [];
            this.controller.edit();
            scope.$digest();
            expect(discoverStateSvc.explore.editing).toBe(true);
            expect(discoverStateSvc.explore.instance.original).toEqual(discoverStateSvc.explore.instance.entity);
        });
        it('edit and does not have modify permission', function() {
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
            discoverStateSvc.explore.editing = false;
            discoverStateSvc.explore.instance.original = [];
            this.controller.edit();
            scope.$digest();
            expect(discoverStateSvc.explore.editing).toBe(false);
            expect(utilSvc.createErrorToast).toHaveBeenCalled();
        });
    });
    it('should call edit when the edit button is clicked', function() {
        spyOn(this.controller, 'edit');
        var button = angular.element(this.element.querySelectorAll('.float-right.edit-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.edit).toHaveBeenCalled();
    });
});
