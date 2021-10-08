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
    mockOntologyManager,
    mockOntologyState,
    mockCatalogManager,
    mockPrefixes,
    mockUtil,
    mockMapperState,
    mockHttpService,
    mockPolicyEnforcement,
    mockPolicyManager,
    mockModal,
    mockSettingManager,
    injectTrustedFilter,
    injectHighlightFilter
} from '../../../../../../test/js/Shared';

describe('Open Ontology Tab component', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, prefixes, settingManagerSvc, utilSvc, mapperStateSvc, catalogManagerSvc, policyManagerSvc, policyEnforcementSvc, httpSvc, modalSvc;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'uploadSnackbar');
        mockOntologyManager();
        mockOntologyState();
        mockCatalogManager();
        mockPrefixes();
        mockUtil();
        mockMapperState();
        mockHttpService();
        mockPolicyEnforcement();
        mockSettingManager();
        mockPolicyManager();
        mockModal();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _prefixes_, _utilService_, _mapperStateService_, _catalogManagerService_, _policyManagerService_, _policyEnforcementService_, _settingManagerService_, _httpService_, _modalService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            mapperStateSvc = _mapperStateService_;
            settingManagerSvc = _settingManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            policyManagerSvc = _policyManagerService_;
            policyEnforcementSvc = _policyEnforcementService_;
            httpSvc = _httpService_;
            modalSvc = _modalService_;
        });

        this.records = {
            data: [],
            headers: () => [{'x-total-count': 11}]
        };
        this.recordsData = [{'@id': 'recordA', [prefixes.dcterms + 'identifier']: [{'@value': 'A'}]},
            {'@id': 'recordB', [prefixes.dcterms + 'identifier']: [{'@value': 'B'}]},
            {'@id': 'recordC', [prefixes.dcterms + 'identifier']: [{'@value': 'C'}]},
            {'@id': 'recordD', [prefixes.dcterms + 'identifier']: [{'@value': 'D'}]},
            {'@id': 'recordE', [prefixes.dcterms + 'identifier']: [{'@value': 'E'}]},
            {'@id': 'recordF', [prefixes.dcterms + 'identifier']: [{'@value': 'F'}]},
            {'@id': 'recordG', [prefixes.dcterms + 'identifier']: [{'@value': 'G'}]},
            {'@id': 'recordH', [prefixes.dcterms + 'identifier']: [{'@value': 'H'}]},
            {'@id': 'recordI', [prefixes.dcterms + 'identifier']: [{'@value': 'I'}]},
            {'@id': 'recordJ', [prefixes.dcterms + 'identifier']: [{'@value': 'J'}]},
            {'@id': 'recordK', [prefixes.dcterms + 'identifier']: [{'@value': 'K'}]}];

        catalogManagerSvc.getRecords.and.callFake((catalogId, paginatedConfig, id) => {
            this.records.data = _.chunk(this.recordsData, paginatedConfig.limit)[paginatedConfig.pageIndex];
            return $q.when(this.records);
        });
        utilSvc.getDctermsValue.and.returnValue('A');
        this.element = $compile(angular.element('<open-ontology-tab></open-ontology-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('openOntologyTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        prefixes = null;
        utilSvc = null;
        mapperStateSvc = null;
        catalogManagerSvc = null;
        settingManagerSvc = null;
        httpSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('OPEN-ONTOLOGY-TAB');
            expect(this.element.querySelectorAll('.open-ontology-tab.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-10').length).toEqual(1);
            expect(this.element.querySelectorAll('.actions').length).toEqual(1);
            expect(this.element.querySelectorAll('.ontologies').length).toEqual(1);
        });
        _.forEach(['form', 'paging', 'upload-snackbar'], item => {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toEqual(1);
            });
        });
        it('with a .list-group', function() {
            expect(this.element.querySelectorAll('.list-group').length).toEqual(1);
        });
        it('with buttons to upload an ontology and make a new ontology', function() {
            var buttons = this.element.querySelectorAll('.actions button');
            expect(buttons.length).toEqual(2);
            expect(['Upload Ontology', 'New Ontology'].indexOf(angular.element(buttons[0]).text().trim()) >= 0).toEqual(true);
            expect(['Upload Ontology', 'New Ontology'].indexOf(angular.element(buttons[1]).text().trim()) >= 0).toEqual(true);
        });
        it('depending on how many ontologies there are', function() {
            expect(this.element.querySelectorAll('.ontologies .list-group-item').length).toEqual(10);
            expect(this.element.querySelectorAll('.ontologies info-message').length).toEqual(0);
            this.controller.filteredList = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.ontologies .list-group-item').length).toEqual(0);
            expect(this.element.querySelectorAll('.ontologies info-message').length).toEqual(1);
        });
        it('depending on whether an ontology is open', function() {
            spyOn(this.controller, 'isOpened').and.returnValue(false);
            scope.$digest();
            var ontology = angular.element(this.element.querySelectorAll('.ontologies .list-group-item h3')[0]);
            expect(ontology.querySelectorAll('.text-muted').length).toEqual(0);

            this.controller.isOpened.and.returnValue(true);
            scope.$digest();
            expect(ontology.querySelectorAll('.text-muted').length).toEqual(1);
        });
        it('depending if a user has access to manage a record', function() {
            this.controller.filteredList = [{userCanManage: true}];
            scope.$digest();
            expect(this.element.querySelectorAll('.ontologies .list-group-item action-menu a').length).toEqual(2);
        });
        it('with a hidden file input', function() {
            expect(this.element.querySelectorAll('input[type="file"].hide').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('should update the uploaded files', function() {
            spyOn(this.controller, 'showUploadOntologyOverlay');
            this.controller.updateFiles(undefined, [{}]);
            expect(ontologyStateSvc.uploadFiles).toEqual([{}]);
            expect(this.controller.showUploadOntologyOverlay).toHaveBeenCalled();
        });
        it('should determine whether an ontology is open', function() {
            expect(this.controller.isOpened({'@id': 'id'})).toEqual(false);
            ontologyStateSvc.list = [{ontologyRecord: {recordId: 'id'}}];
            expect(this.controller.isOpened({'@id': 'id'})).toEqual(true);
        });
        describe('should open an ontology', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.returnValue('title');
            });
            it('if it is already open', function() {
                ontologyStateSvc.list = [{ontologyRecord: {recordId: 'id'}}];
                this.controller.open({'@id': 'id'});
                expect(ontologyStateSvc.openOntology).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem).toEqual({ontologyRecord: {recordId: 'id'}, active: true});
            });
            describe('if it is not already open', function() {
                it('successfully', function() {
                    var ontologyId = 'ontologyId';
                    ontologyStateSvc.openOntology.and.returnValue($q.resolve(ontologyId));
                    this.controller.open({'@id': 'id'});
                    scope.$apply();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'id'}, 'title');
                    expect(ontologyStateSvc.openOntology).toHaveBeenCalledWith('id', 'title');
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless an error occurs', function() {
                    ontologyStateSvc.openOntology.and.returnValue($q.reject('Error message'));
                    this.controller.open({'@id': 'id'});
                    scope.$apply();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'id'}, 'title');
                    expect(ontologyStateSvc.openOntology).toHaveBeenCalledWith('id', 'title');
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                });
            });
        });
        it('should set the correct state for creating a new ontology', function() {
            settingManagerSvc.defaultNamespace = 'https://mobi.com/ontologies/';
            this.controller.newOntology();
            expect(_.startsWith(ontologyStateSvc.newOntology['@id'], 'https://mobi.com/ontologies/')).toEqual(true);
            expect(ontologyStateSvc.newOntology[prefixes.dcterms + 'title']).toEqual([{'@value': ''}]);
            expect(ontologyStateSvc.newOntology[prefixes.dcterms + 'description']).toEqual([{'@value': ''}]);
            expect(ontologyStateSvc.newLanguage).toEqual(undefined);
            expect(ontologyStateSvc.newKeywords).toEqual([]);
            expect(modalSvc.openModal).toHaveBeenCalledWith('newOntologyOverlay');
        });
        describe('should show the delete confirmation overlay', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.returnValue('title');
            });
            it('and ask the user for confirmation', function() {
                this.controller.showDeleteConfirmationOverlay({'@id': 'record'});
                expect(this.controller.recordId).toEqual('record');
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith({asymmetricMatch: actual => !actual.includes('<error-display>')}, this.controller.deleteOntology);
            });
            it('and should warn the user if the ontology is open in the mapping tool', function() {
                mapperStateSvc.sourceOntologies = [{'recordId':'record'}];
                this.controller.showDeleteConfirmationOverlay({'@id': 'record'});
                expect(this.controller.recordId).toEqual('record');
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('<error-display>'), this.controller.deleteOntology);
            });
        });
        describe('should delete an ontology', function() {
            beforeEach(function() {
                this.controller.showDeleteConfirmation = true;
                this.controller.filterText = "filterText";
                this.recordId = 'recordA';
                this.controller.recordId = this.recordId;
                ontologyStateSvc.getOntologyStateByRecordId.and.returnValue({id: 'state'});
                spyOn(this.controller, 'getPageOntologyRecords');
            });
            it('unless an error occurs', function() {
                ontologyManagerSvc.deleteOntology.and.returnValue($q.reject('Error message'));
                this.controller.deleteOntology();
                scope.$apply();
                expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(this.controller.recordId);
                expect(ontologyStateSvc.closeOntology).not.toHaveBeenCalled();
                expect(this.records.data).toContain(jasmine.objectContaining({'@id': this.recordId}));
                expect(ontologyStateSvc.getOntologyStateByRecordId).not.toHaveBeenCalled();
                expect(ontologyStateSvc.deleteOntologyState).not.toHaveBeenCalled();
                expect(this.controller.getPageOntologyRecords).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                this.controller.deleteOntology();
                scope.$apply();
                expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(this.controller.recordId);
                expect(ontologyStateSvc.closeOntology).toHaveBeenCalledWith(this.controller.recordId);
                expect(this.records).not.toContain(jasmine.objectContaining({'@id': this.recordId}));
                expect(ontologyStateSvc.getOntologyStateByRecordId).toHaveBeenCalledWith(this.recordId);
                expect(ontologyStateSvc.deleteOntologyState).toHaveBeenCalledWith(this.recordId);
                expect(this.controller.getPageOntologyRecords).toHaveBeenCalledWith(1, "filterText");
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        it('should get the list of ontology records at the specified page', function() {
            var catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
            var sortOption = {field: 'http://purl.org/dc/terms/title', asc: true};
            catalogManagerSvc.sortOptions = [sortOption];
            var page = 2;
            var paginatedConfig = {
                pageIndex: page - 1,
                limit: 10,
                recordType: prefixes.ontologyEditor + 'OntologyRecord',
                sortOption,
                searchText: undefined
            };
            ontologyStateSvc.list = [{ontologyRecord: {'recordId': 'recordA'}}];
            this.controller.getPageOntologyRecords(page);
            scope.$apply();
            expect(this.controller.currentPage).toEqual(page);
            expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogId, paginatedConfig, this.controller.id);
            expect(this.controller.filteredList).toContain(jasmine.objectContaining({'@id': 'recordK'}));
        });
        it('should perform a search', function() {
            spyOn(this.controller, 'getPageOntologyRecords');
            this.controller.filterText = "searchText"
            this.controller.search();
            expect(this.controller.getPageOntologyRecords).toHaveBeenCalledWith(1 , "searchText");
        });
        it('should show a record access overlay', function() {
            this.controller.showAccessOverlay({'@id': 'recordId'}, 'rule');
            expect(modalSvc.openModal).toHaveBeenCalledWith('recordAccessOverlay', {ruleId: 'rule', resource: 'recordId'});
        });
        it('should show the uploadOntologyOverlay', function() {
            this.controller.showUploadOntologyOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('uploadOntologyOverlay', {startUpload: this.controller.startUpload, finishUpload: this.controller.finishUpload});
        });
        it('should handle starting an upload', function() {
            ontologyStateSvc.uploadPending = 0;
            this.controller.startUpload();
            expect(ontologyStateSvc.uploadPending).toEqual(1);
            expect(this.controller.showSnackbar).toEqual(true);
        });
        describe('should handle finishing an upload', function() {
            beforeEach(function() {
                spyOn(this.controller, 'search');
            });
            it('if there are no more uploads pending', function() {
                ontologyStateSvc.uploadPending = 1;
                this.controller.finishUpload();
                expect(ontologyStateSvc.uploadPending).toEqual(0);
                expect(this.controller.search).toHaveBeenCalled();
            });
            it('if there are uploads pending', function() {
                ontologyStateSvc.uploadPending = 2;
                this.controller.finishUpload();
                expect(ontologyStateSvc.uploadPending).toEqual(1);
                expect(this.controller.search).not.toHaveBeenCalled();
            });
        });
    });
    it('should call newOntology when the button is clicked', function() {
        spyOn(this.controller, 'newOntology');
        var button = angular.element(this.element.querySelectorAll('.actions button')[0]);
        button.triggerHandler('click');
        expect(this.controller.newOntology).toHaveBeenCalled();
    });
    it('should call showDeleteConfirmationOverlay when a delete link is clicked', function() {
        spyOn(this.controller, 'showDeleteConfirmationOverlay');
        var link = angular.element(this.element.querySelectorAll('.ontologies .list-group-item action-menu a.delete-record')[0]);
        link.triggerHandler('click');
        expect(this.controller.showDeleteConfirmationOverlay).toHaveBeenCalledWith(this.controller.filteredList[0]);
    });
});
