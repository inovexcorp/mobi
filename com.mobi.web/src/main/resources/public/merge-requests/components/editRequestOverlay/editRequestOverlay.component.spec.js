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
describe('Edit Request Overlay Component', function() {
    var $compile, scope, $q, mergeRequestsStateSvc, mergeRequestManagerSvc, catalogManagerSvc, modalSvc, userManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('merge-requests');
        injectTrustedFilter();
        injectHighlightFilter();
        mockMergeRequestsState();
        mockMergeRequestManager();
        mockCatalogManager();
        mockUserManager();
        mockModal();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_, _mergeRequestManagerService_, _catalogManagerService_, _userManagerService_, _modalService_, _utilService_, _prefixes_, _trustedFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            userManagerSvc = _userManagerService_;
            modalSvc = _modalService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            trustedFilter = _trustedFilter_;
        });

        this.getDefer = $q.defer();
        
        mergeRequestsStateSvc.selected = {
            'recordIri': 'urn://test/ontology/1',
            'title': 'Test Ontology 1',
            'jsonld': {
                '@id': 'urn://test/merge-request/1',
                [prefixes.dcterms + 'title']: [{'@value': 'Test Ontology 1'}],
                [prefixes.dcterms + 'description']: [{'@value': ''}],
                [prefixes.mergereq + 'sourceBranch']: [{'@id': 'urn://test/branch/source'}],
                [prefixes.mergereq + 'targetBranch']: [{'@id': 'urn://test/branch/target'}],
                [prefixes.mergereq + 'assignee']: [{'@id': 'urn://test/user/user-1'}],
                [prefixes.mergereq + 'removeSource']: [{'@type': prefixes.xsd + 'boolean', '@value': 'true'}]
            },
            'sourceBranchId': {'@id': 'urn://test/branch/source'},
            'targetBranchId': {'@id': 'urn://test/branch/target'},
            'sourceBranch': {'@id': 'urn://test/branch/source'},
            'targetBranch': {'@id': 'urn://test/branch/target'},
            'difference': {'additions': [], 'deletions': []},
            'removeSource': true
        };

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<edit-request-overlay close="close()" dismiss="dismiss()"></edit-request-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editRequestOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestsStateSvc = null;
        mergeRequestManagerSvc = null;
        catalogManagerSvc = null;
        userManagerSvc = null;
        modalSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('close should be called in parent scope when invoked', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in parent scope when invoked', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('initializes with the correct values', function() {
        var expectedRequest = {
            recordId: mergeRequestsStateSvc.selected.recordIri,
            title: mergeRequestsStateSvc.selected.title,
            description: mergeRequestsStateSvc.selected.jsonld[prefixes.dcterms + 'description'][0]['@value'],
            sourceTitle: mergeRequestsStateSvc.selected.sourceTitle,
            sourceBranch: mergeRequestsStateSvc.selected.sourceBranch,
            targetBranch: mergeRequestsStateSvc.selected.targetBranch,
            difference: mergeRequestsStateSvc.selected.difference,
            assignees: [mergeRequestsStateSvc.selected.jsonld[prefixes.mergereq + 'assignee'][0]['@id']],
            removeSource: mergeRequestsStateSvc.selected.removeSource
        };

        expect(this.controller.request).toEqual(expectedRequest);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('EDIT-REQUEST-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with .form-groups', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(4);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a text-input', function() {
            expect(this.element.find('text-input').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a branch-select', function() {
            expect(this.element.find('branch-select').length).toBe(1);
        });
        it('with a checkbox', function() {
            expect(this.element.find('checkbox').length).toBe(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    describe('controller methods', function() {
        it('should update the merge request', function() {
            utilSvc.updateDctermsValue.and.callFake((entity, prop) => {
                if (prop === 'title') {
                    entity[prefixes.dcterms + 'title'][0]['@value'] = 'Updated Title';
                } else if (prop === 'description') {
                    entity[prefixes.dcterms + 'description'][0]['@value'] = 'Updated description.';
                }
            });
            var updatedJson = angular.copy(mergeRequestsStateSvc.selected.jsonld);
            updatedJson[prefixes.dcterms + 'title'][0]['@value'] = 'Updated Title';
            updatedJson[prefixes.dcterms + 'description'][0]['@value'] = 'Updated description.';
            updatedJson[[prefixes.mergereq + 'targetBranch']][0]['@id'] = 'urn://test/branch/new-target';
            updatedJson[[prefixes.mergereq + 'assignee']][0]['@id'] = 'urn://test/user/user-2';
            updatedJson[[prefixes.mergereq + 'removeSource']][0]['@value'] = 'false';

            this.controller.request.title = 'Updated Title';
            this.controller.request.description = 'Updated description.';
            this.controller.request.targetBranch = {'@id': 'urn://test/branch/new-target'};
            this.controller.request.assignees = ['urn://test/user/user-2'];
            this.controller.request.removeSource = false;

            this.controller.submit();
            expect(mergeRequestManagerSvc.updateRequest).toHaveBeenCalledWith(mergeRequestsStateSvc.selected.jsonld['@id'], updatedJson);
        });
        it('should cancel the edit', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
});
