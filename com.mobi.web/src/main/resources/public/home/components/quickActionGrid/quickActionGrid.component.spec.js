/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Quick Action Grid component', function() {
    var $compile, scope, $state, $window, ontologyStateSvc, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('home');
        mockOntologyState();
        mockDiscoverState();

        module(function($provide) {
            $provide.service('$state', function() {
                this.go = jasmine.createSpy('go');
            });
            $provide.service('$window', function() {
                this.open = jasmine.createSpy('open');
            });
        });

        inject(function(_$compile_, _$rootScope_, _$state_, _$window_, _ontologyStateService_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $state = _$state_;
            $window = _$window_;
            ontologyStateSvc = _ontologyStateService_;
            discoverStateSvc = _discoverStateService_;
        });

        this.element = $compile(angular.element('<quick-action-grid></quick-action-grid>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('quickActionGrid');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $state = null;
        $window = null;
        ontologyStateSvc = null;
        discoverStateSvc = null;
        this.element.remove();
    });

    it('should initialize with the correct action list', function() {
        expect(this.controller.actions.length).toEqual(2);
        expect(_.flatten(this.controller.actions).length).toEqual(6);
    });
    describe('controller methods', function() {
        it('should search the catalog', function() {
            this.controller.searchTheCatalog();
            expect($state.go).toHaveBeenCalledWith('root.catalog');
        });
        describe('should open an ontology', function() {
            it('if one is selected', function() {
                var item = {active: true};
                ontologyStateSvc.listItem = item;
                this.controller.openAnOntology();
                expect($state.go).toHaveBeenCalledWith('root.ontology-editor');
                expect(item.active).toEqual(false);
                expect(ontologyStateSvc.listItem).toEqual({});
            });
            it('if one is not selected', function() {
                this.controller.openAnOntology();
                expect($state.go).toHaveBeenCalledWith('root.ontology-editor');
                expect(ontologyStateSvc.listItem).toEqual({});
            });
        });
        it('should explore data', function() {
            this.controller.exploreData();
            expect($state.go).toHaveBeenCalledWith('root.discover');
            expect(discoverStateSvc.explore.active).toEqual(true);
            expect(discoverStateSvc.search.active).toEqual(false);
            expect(discoverStateSvc.query.active).toEqual(false);
        });
        it('should query data', function() {
            this.controller.queryData();
            expect($state.go).toHaveBeenCalledWith('root.discover');
            expect(discoverStateSvc.explore.active).toEqual(false);
            expect(discoverStateSvc.search.active).toEqual(false);
            expect(discoverStateSvc.query.active).toEqual(true);
        });
        it('should read the documentation', function() {
            this.controller.readTheDocumentation();
            expect($window.open).toHaveBeenCalledWith(jasmine.any(String), '_blank');
        });
        it('should ingest data', function() {
            this.controller.ingestData();
            expect($state.go).toHaveBeenCalledWith('root.mapper');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('QUICK-ACTION-GRID');
            expect(this.element.querySelectorAll('.quick-action-grid').length).toEqual(1);
            expect(this.element.querySelectorAll('.card').length).toEqual(1);
            expect(this.element.querySelectorAll('.card-body').length).toEqual(1);
        });
        it('depending on how many actions there are', function() {
            var rows = this.element.querySelectorAll('.card-body .row');
            expect(rows.length).toEqual(this.controller.actions.length);
            _.forEach(this.controller.actions, arr => {
                expect(angular.element(rows[0]).querySelectorAll('.col').length).toEqual(arr.length);
            });
        });
    });
});