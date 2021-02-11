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
    mockCatalogManager, mockOntologyManager, mockToastr
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
        mockToastr();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _ontologyManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
        });

        scope.resolve = {
            commit: {}
        };
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<commit-info-overlay resolve="resolve" dismiss="dismiss()"></commit-info-overlay>'))(scope);
        this.difference = {
            additions: [],
            deletions: []
        };
        this.headers = {'has-more-results': 'false'};
        catalogManagerSvc.getDifference.and.returnValue($q.when({data: this.difference, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
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
                commit: {}
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

            this.difference.additions = [{}];
            this.difference.deletions = [];
            catalogManagerSvc.getDifference.and.returnValue($q.when({data: this.difference, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
            this.controller.$onInit();
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-container p').length).toEqual(0);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toEqual(1);

            this.difference.additions = [];
            this.difference.deletions = [{}];
            catalogManagerSvc.getDifference.and.returnValue($q.when({data: this.difference, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
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
            describe('if getDifference resolves', function() {
                beforeEach(function() {
                    this.headers = {'has-more-results': 'true'};
                    catalogManagerSvc.getDifference.and.returnValue($q.when({data: {additions: [{'@id': 'iri1'}], deletions: []}, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
                })
                describe('and resolve.ontRecordId is set', function() {
                    beforeEach(function() {
                        scope.resolve = {
                            commit: {'id':'123'},
                            ontRecordId: 'recordId'
                        };
                        scope.$digest();
                        utilSvc.getObjIrisFromDifference.and.returnValue([]);
                    });
                    describe('and getOntologyEntityNames', function() {
                        it('resolves', function() {
                            ontologyManagerSvc.getOntologyEntityNames.and.returnValue({'iri1':{label: 'label'}});
                            this.controller.retrieveMoreResults(100, 0);
                            scope.$apply();
                            expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                            expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith('recordId', '', '123', false, false, ['iri1']);
                            expect(this.controller.additions).toEqual([{'@id': 'iri1'}]);
                            expect(this.controller.deletions).toEqual([]);
                            expect(this.controller.hasMoreResults).toEqual(true);
                            expect(this.controller.entityNames).toEqual({'iri1':{label: 'label'}});
                        });
                        it('rejects', function() {
                            ontologyManagerSvc.getOntologyEntityNames.and.returnValue($q.reject('Error Message'));
                            this.controller.retrieveMoreResults(100, 0);
                            scope.$apply();
                            expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                            expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith('recordId', '', '123', false, false, ['iri1']);
                            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                        });
                    });
                });
                it('and resolve.recordId is not set', function() {
                    scope.resolve = {
                        commit: {'id':'123'}
                    };
                    scope.$digest();
                    this.controller.retrieveMoreResults(100, 0);
                    scope.$apply();
                    expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                    expect(this.controller.additions).toEqual([{'@id': 'iri1'}]);
                    expect(this.controller.deletions).toEqual([]);
                    expect(this.controller.hasMoreResults).toEqual(true);
                    expect(this.controller.entityNames).toEqual({});
                });
            });
            it('unless getDifference rejects', function() {
                scope.resolve = {
                    commit: {'id':'123'}
                };
                scope.$digest();
                catalogManagerSvc.getDifference.and.returnValue($q.reject('Error Message'));
                this.controller.retrieveMoreResults(100, 0);
                scope.$apply();
                expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('123', null, 100, 0);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
        describe('getEntityName returns when the calculated entityName', function() {
            it('exists', function() {
                this.controller.entityNames['iri'] = {label: 'iriLabel'};
                expect(this.controller.getEntityName('iri')).toEqual('iriLabel');
                expect(utilSvc.getBeautifulIRI).not.toHaveBeenCalled();
            });
            it('does not exist', function() {
                this.controller.entityNames = undefined;
                utilSvc.getBeautifulIRI.and.returnValue('beautifulIri');
                expect(this.controller.getEntityName('iri')).toEqual('beautifulIri');
                expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith('iri');
            });
        });
    });
});