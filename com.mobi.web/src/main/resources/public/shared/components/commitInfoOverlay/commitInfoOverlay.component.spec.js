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

import {
    mockComponent,
    mockUserManager,
    mockUtil,
    mockCatalogManager, mockOntologyManager
} from '../../../../../../test/js/Shared';

describe('Commit Info Overlay component', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyManagerSvc, utilSvc;

    beforeEach(function() {
        angular.mock.module('shared');
        mockComponent('shared', 'commitChangesDisplay');
        mockUserManager();
        mockCatalogManager();
        mockOntologyManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _ontologyManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
        });

        scope.resolve = {
            commit: {},
            additions: [],
            deletions: []
        };
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<commit-info-overlay resolve="resolve" dismiss="dismiss()"></commit-info-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitInfoOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('resolve should be one way bound', function() {
            this.controller.resolve = {};
            scope.$digest();
            expect(scope.resolve).toEqual({
                commit: {},
                additions: [],
                deletions: []
            });
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('COMMIT-INFO-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(this.element.querySelectorAll('.changes-container p').length).toEqual(1);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toEqual(0);

            scope.resolve.additions = [{}];
            this.controller.$onInit();
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-container p').length).toEqual(0);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toEqual(1);

            scope.resolve.additions = [];
            scope.resolve.deletions = [{}];
            this.controller.$onInit();
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-container p').length).toEqual(0);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toEqual(1);
        });
        it('with a button to cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(1);
            expect(angular.element(buttons[0]).text().trim()).toEqual('Cancel');
        });
    });
    describe('controller methods', function() {
        it('should cancel the overlay', function() {
            this.controller.cancel();
            scope.$digest();
            expect(scope.dismiss).toHaveBeenCalled();
        });
        describe('should update additions and deletions', function() {
            it('if getDifference resolves', function() {
                this.headers = {'has-more-results': 'true'};
                catalogManagerSvc.getDifference.and.returnValue($q.when({data: {additions: [{}], deletions: []}, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
                scope.resolve = {
                    commit: {'id':'123'},
                    additions: [{}],
                    deletions: []
                };
                scope.$digest();
                this.controller.retrieveMoreResults(100, 0);
                scope.$apply();
                expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                expect(this.controller.additions).toEqual([{}]);
                expect(this.controller.deletions).toEqual([]);
                expect(this.controller.hasMoreResults).toEqual(true);
            });
            it('unless getDifference rejects', function() {
                scope.resolve = {
                    commit: {'id':'123'},
                    additions: [{}],
                    deletions: []
                };
                scope.$digest();
                catalogManagerSvc.getDifference.and.returnValue($q.reject('Error Message'));
                this.controller.retrieveMoreResults(100, 0);
                scope.$apply();
                expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
    });
});