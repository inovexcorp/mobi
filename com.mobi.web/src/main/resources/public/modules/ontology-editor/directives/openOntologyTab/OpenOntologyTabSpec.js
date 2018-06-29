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
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, stateManagerSvc, prefixes, utilSvc, mapperStateSvc, catalogManagerSvc, httpSvc;

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

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _stateManagerService_, _prefixes_, _utilService_, _mapperStateService_, _catalogManagerService_, _httpService_) {
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
        });

        this.records = { 
            data: [],    
            headers: function() {
                return [{'x-total-count': 11}];
            }
        };
        this.recordsData = [{'@id': 'recordA', [prefixes.dcterms + 'identifier']: [{}]},
            {'@id': 'recordB'},
            {'@id': 'recordC'},
            {'@id': 'recordD'},
            {'@id': 'recordE'},
            {'@id': 'recordF'},
            {'@id': 'recordG'},
            {'@id': 'recordH'},
            {'@id': 'recordI'},
            {'@id': 'recordJ'},
            {'@id': 'recordK'}];
        this.recordsData[0][prefixes.dcterms + 'identifier'] = [{'@value': 'A'}];
        this.recordsData[1][prefixes.dcterms + 'identifier'] = [{'@value': 'B'}];
        this.recordsData[2][prefixes.dcterms + 'identifier'] = [{'@value': 'C'}];
        this.recordsData[3][prefixes.dcterms + 'identifier'] = [{'@value': 'D'}];
        this.recordsData[4][prefixes.dcterms + 'identifier'] = [{'@value': 'E'}];
        this.recordsData[5][prefixes.dcterms + 'identifier'] = [{'@value': 'F'}];
        this.recordsData[6][prefixes.dcterms + 'identifier'] = [{'@value': 'G'}];
        this.recordsData[7][prefixes.dcterms + 'identifier'] = [{'@value': 'H'}];
        this.recordsData[8][prefixes.dcterms + 'identifier'] = [{'@value': 'I'}];
        this.recordsData[9][prefixes.dcterms + 'identifier'] = [{'@value': 'J'}];
        this.recordsData[10][prefixes.dcterms + 'identifier'] = [{'@value': 'K'}];

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
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('open-ontology-tab')).toBe(true);
            expect(this.element.querySelectorAll('.actions').length).toBe(1);
            expect(this.element.querySelectorAll('.list').length).toBe(1);
            expect(this.element.querySelectorAll('.open-ontology-content').length).toBe(1);
            expect(this.element.querySelectorAll('.ontologies').length).toBe(1);
            expect(this.element.querySelectorAll('.paging-container').length).toBe(1);
        });
        _.forEach(['block', 'block-content', 'form', 'block-footer', 'pagination'], (item) => {
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
        it('depending on whether an ontology is being deleted', function() {
            expect(this.element.querySelectorAll('confirmation-overlay').length).toBe(0);
            this.controller.showDeleteConfirmation = true;
            scope.$digest();
            expect(this.element.querySelectorAll('confirmation-overlay').length).toBe(1);
        });
        it('depending on whether there is an error deleting an ontology', function() {
            this.controller.showDeleteConfirmation = true;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.errorMessage = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on how many unopened ontologies there are, the limit, and the offset', function() {
            this.controller.limit = 10;
            this.controller.pageIndex = 0;
            scope.$apply();
            expect(this.element.querySelectorAll('.ontologies .ontology').length).toBe(10);
            expect(this.element.querySelectorAll('.ontologies info-message').length).toBe(0);

            this.controller.getPage('next');
            scope.$apply();
            expect(this.element.querySelectorAll('.ontologies .ontology').length).toBe(1);
            expect(this.element.querySelectorAll('.ontologies info-message').length).toBe(0);
        });
        it('depending on if the ontology being deleted is currently being used in the mapping tool', function() {
            this.controller.showDeleteConfirmation = true;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.mappingErrorMessage = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('should open an ontology', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.returnValue('title');
            });
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
        it('should set the correct state for creating a new ontology', function() {
            this.controller.newOntology();
            expect(ontologyStateSvc.showNewTab).toEqual(true);
            expect(_.startsWith(ontologyStateSvc.newOntology['@id'], 'https://mobi.com/ontologies/')).toEqual(true);
            expect(ontologyStateSvc.newOntology[prefixes.dcterms + 'title']).toEqual([{'@value': ''}]);
            expect(ontologyStateSvc.newOntology[prefixes.dcterms + 'description']).toEqual([{'@value': ''}]);
            expect(ontologyStateSvc.newLanguage).toEqual(undefined);
            expect(ontologyStateSvc.newKeywords).toEqual([]);
        });
        it('should get a page of results', function() {
            var begin = this.controller.pageIndex;
            this.controller.getPage('next');
            expect(this.controller.pageIndex).toBe(begin + 1);

            begin = this.controller.pageIndex;
            this.controller.getPage('prev');
            expect(this.controller.pageIndex).toBe(begin - 1);
        });
        describe('should show the delete confirmation overlay', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.returnValue('title');
            });
            it('and ask the user for confirmation', function() {
                this.controller.showDeleteConfirmationOverlay({'@id': 'record'});
                expect(this.controller.recordId).toBe('record');
                expect(this.controller.recordTitle).toBe('title');
                expect(this.controller.errorMessage).toBe('');
                expect(this.controller.showDeleteConfirmation).toBe(true);
            });
            it('and should warn the user if the ontology is open in the mapping tool', function() {
                mapperStateSvc.sourceOntologies = [{'recordId':'record'}];

                this.controller.showDeleteConfirmationOverlay({'@id': 'record'});

                expect(this.controller.recordId).toBe('record');
                expect(this.controller.recordTitle).toBe('title');
                expect(this.controller.errorMessage).toBe('');
                expect(this.controller.mappingErrorMessage).not.toBeUndefined();
                expect(this.controller.showDeleteConfirmation).toBe(true);
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
                expect(this.controller.showDeleteConfirmation).toBe(true);
                expect(this.controller.errorMessage).toBe('Error message');
                expect(this.controller.mappingErrorMessage).toBeUndefined();
            });
            it('successfully', function() {
                this.controller.deleteOntology();
                scope.$apply();
                expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(this.controller.recordId);
                expect(this.records).not.toContain(jasmine.objectContaining({'@id': 'recordA'}));
                expect(stateManagerSvc.getOntologyStateByRecordId).toHaveBeenCalled();
                expect(stateManagerSvc.deleteState).toHaveBeenCalledWith('state');
                expect(this.controller.showDeleteConfirmation).toBe(false);
                expect(this.controller.errorMessage).toBeUndefined();
                expect(this.controller.mappingErrorMessage).toBeUndefined();
            });
        });
        it('should get the list of unopened ontology records', function() {
            var catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
            var sortOption = 'sort';
            var ontologyRecordType = prefixes.ontologyEditor + 'OntologyRecord';
            var paginatedConfig = {
                pageIndex: 0,
                limit: 10,
                recordType: ontologyRecordType,
                sortOption,
                searchText: undefined
            };
            ontologyStateSvc.list = [{ontologyRecord: {'recordId': 'recordA'}}];
            this.controller.getPageOntologyRecords('sort');
            scope.$apply();
            expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogId, paginatedConfig, this.controller.id);
            expect(this.controller.filteredList).not.toContain(jasmine.objectContaining({'@id': 'recordA'}));
        });
    });
    it('should filter the ontology list when the filter text changes', function() {
        utilSvc.getDctermsValue.and.callFake(function(obj, filter) {
            return obj['@id'] === 'recordA' ? 'test' : '';
        });
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
        expect(this.controller.showDeleteConfirmationOverlay).toHaveBeenCalledWith(this.controller.filteredList[0]);
    });
});
