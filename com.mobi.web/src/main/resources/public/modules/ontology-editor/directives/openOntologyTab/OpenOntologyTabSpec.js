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
describe('Open Ontology Tab directive', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, stateManagerSvc, prefixes, utilSvc, mapperStateSvc, catalogManagerSvc, httpSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('openOntologyTab');
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyManager();
        mockOntologyState();
        mockCatalogManager();
        mockPrefixes();
        mockStateManager();
        mockUtil();
        mockMapperState();
        mockHttpService();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _stateManagerService_, _prefixes_, _utilService_, _mapperStateService_, _catalogManagerService_, _httpService_, _modalService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            mapperStateSvc = _mapperStateService_;
            catalogManagerSvc = _catalogManagerService_;
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
        stateManagerSvc = null;
        prefixes = null;
        utilSvc = null;
        mapperStateSvc = null;
        catalogManagerSvc = null;
        httpSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('open-ontology-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
            expect(this.element.querySelectorAll('.actions').length).toBe(1);
            expect(this.element.querySelectorAll('.ontologies').length).toBe(1);
            expect(this.element.querySelectorAll('.paging-container').length).toBe(1);
        });
        _.forEach(['form', 'pagination'], item => {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('with custom buttons to upload an ontology and make a new ontology', function() {
            var buttons = this.element.querySelectorAll('.actions button');
            expect(buttons.length).toBe(2);
            expect(['Upload Ontology', 'New Ontology'].indexOf(angular.element(buttons[0]).text().trim()) >= 0).toBe(true);
            expect(['Upload Ontology', 'New Ontology'].indexOf(angular.element(buttons[1]).text().trim()) >= 0).toBe(true);
        });
        it('depending on how many ontologies there are', function() {
            expect(this.element.querySelectorAll('.ontologies .ontology').length).toBe(10);
            expect(this.element.querySelectorAll('.ontologies info-message').length).toBe(0);
            this.controller.filteredList = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.ontologies .ontology').length).toBe(0);
            expect(this.element.querySelectorAll('.ontologies info-message').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should return the correct title depending on whether the ontology is open', function() {
            expect(this.controller.getRecordTitle({'@id': 'id'})).toEqual('A');
            ontologyStateSvc.list = [{ontologyRecord: {recordId: 'id'}}];
            expect(this.controller.getRecordTitle({'@id': 'id'})).toEqual('<span class="text-muted">(Open)</span> A');
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
            this.controller.newOntology();
            expect(ontologyStateSvc.showNewTab).toEqual(true);
            expect(_.startsWith(ontologyStateSvc.newOntology['@id'], 'https://mobi.com/ontologies/')).toEqual(true);
            expect(ontologyStateSvc.newOntology[prefixes.dcterms + 'title']).toEqual([{'@value': ''}]);
            expect(ontologyStateSvc.newOntology[prefixes.dcterms + 'description']).toEqual([{'@value': ''}]);
            expect(ontologyStateSvc.newLanguage).toEqual(undefined);
            expect(ontologyStateSvc.newKeywords).toEqual([]);
        });
        describe('should show the delete confirmation overlay', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.returnValue('title');
                this.event = scope.$emit('click');
                spyOn(this.event, 'stopPropagation');
            });
            it('and ask the user for confirmation', function() {
                this.controller.showDeleteConfirmationOverlay(this.event, {'@id': 'record'});
                expect(this.event.stopPropagation).toHaveBeenCalled();
                expect(this.controller.recordId).toBe('record');
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith({asymmetricMatch: actual => !actual.includes('<error-display>')}, this.controller.deleteOntology);
            });
            it('and should warn the user if the ontology is open in the mapping tool', function() {
                mapperStateSvc.sourceOntologies = [{'recordId':'record'}];
                this.controller.showDeleteConfirmationOverlay(this.event, {'@id': 'record'});
                expect(this.event.stopPropagation).toHaveBeenCalled();
                expect(this.controller.recordId).toBe('record');
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('<error-display>'), this.controller.deleteOntology);
            });
        });
        describe('should delete an ontology', function() {
            beforeEach(function() {
                this.controller.showDeleteConfirmation = true;
                this.controller.recordId = 'recordA';
                stateManagerSvc.getOntologyStateByRecordId.and.returnValue({id: 'state'});
            });
            it('unless an error occurs', function() {
                ontologyManagerSvc.deleteOntology.and.returnValue($q.reject('Error message'));
                this.controller.deleteOntology();
                scope.$apply();
                expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(this.controller.recordId);
                expect(this.records.data).toContain(jasmine.objectContaining({'@id': 'recordA'}));
                expect(stateManagerSvc.getOntologyStateByRecordId).not.toHaveBeenCalled();
                expect(stateManagerSvc.deleteState).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                this.controller.deleteOntology();
                scope.$apply();
                expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(this.controller.recordId);
                expect(this.records).not.toContain(jasmine.objectContaining({'@id': 'recordA'}));
                expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalled();
                expect(stateManagerSvc.deleteState).toHaveBeenCalledWith('state');
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        it('should get the list of ontology records', function() {
            var catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
            var sortOption = {field: 'http://purl.org/dc/terms/title', asc: true};
            catalogManagerSvc.sortOptions = [sortOption];
            var ontologyRecordType = prefixes.ontologyEditor + 'OntologyRecord';
            var paginatedConfig = {
                pageIndex: 0,
                limit: 10,
                recordType: ontologyRecordType,
                sortOption,
                searchText: undefined
            };
            ontologyStateSvc.list = [{ontologyRecord: {'recordId': 'recordA'}}];
            this.controller.getPageOntologyRecords();
            scope.$apply();
            expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogId, paginatedConfig, this.controller.id);
            expect(this.controller.filteredList).toContain(jasmine.objectContaining({'@id': 'recordA'}));
        });
        it('should perform a search if the key pressed was ENTER', function() {
            spyOn(this.controller, 'getPageOntologyRecords');
            this.controller.currentPage = 10;
            this.controller.search({});
            expect(this.controller.currentPage).toEqual(10);
            expect(this.controller.getPageOntologyRecords).not.toHaveBeenCalled();

            this.controller.search({keyCode: 13});
            expect(this.controller.currentPage).toEqual(1);
            expect(this.controller.getPageOntologyRecords).toHaveBeenCalled();
        });
    });
    it('should filter the ontology list when the filter text changes', function() {
        utilSvc.getDctermsValue.and.callFake((obj, filter) => obj['@id'] === 'recordA' ? 'test' : '');
        this.controller.filterText = 'test';
        scope.$apply();
        expect(this.controller.filterText).not.toContain(jasmine.objectContaining({'@id': 'recordB'}));
    });
    it('should call newOntology when the button is clicked', function() {
        spyOn(this.controller, 'newOntology');
        var button = angular.element(this.element.querySelectorAll('.actions button')[0]);
        button.triggerHandler('click');
        expect(this.controller.newOntology).toHaveBeenCalled();
    });
    it('should set the correct state when the upload ontology button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.actions button')[1]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showUploadTab).toBe(true);
    });
    it('should call showDeleteConfirmationOverlay when a delete link is clicked', function() {
        spyOn(this.controller, 'showDeleteConfirmationOverlay');
        var link = angular.element(this.element.querySelectorAll('.ontologies .ontology .action-container a')[0]);
        link.triggerHandler('click');
        expect(this.controller.showDeleteConfirmationOverlay).toHaveBeenCalledWith(jasmine.any(Object), this.controller.filteredList[0]);
    });
});
