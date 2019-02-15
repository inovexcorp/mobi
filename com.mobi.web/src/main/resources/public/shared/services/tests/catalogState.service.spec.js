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
describe('Catalog State service', function() {
    var catalogStateSvc, catalogManagerSvc, prefixes;

    beforeEach(function() {
        module('catalogState');
        mockCatalogManager();
        mockPrefixes();

        inject(function(catalogStateService, _catalogManagerService_, _prefixes_) {
            catalogStateSvc = catalogStateService;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
        });
    });

    afterEach(function () {
        catalogStateSvc = null;
        catalogManagerSvc = null;
        prefixes = null;
    });

    it('should initialize catalog state', function() {
        spyOn(catalogStateSvc, 'initializeRecordSortOption');
        catalogStateSvc.initialize();
        expect(catalogStateSvc.initializeRecordSortOption).toHaveBeenCalled();
    });
    it('should initialize the recordSortOption', function() {
        catalogManagerSvc.sortOptions = [{field: prefixes.dcterms + 'modified', asc: false}, {field: prefixes.dcterms + 'modified', asc: true}];
        catalogStateSvc.initializeRecordSortOption();
        expect(catalogStateSvc.recordSortOption).toEqual({field: prefixes.dcterms + 'modified', asc: false});
    });
    it('should reset the important state variables', function() {
        spyOn(catalogStateSvc, 'initializeRecordSortOption');
        catalogStateSvc.totalRecordSize = 10;
        catalogStateSvc.currentRecordPage = 10;
        catalogStateSvc.recordFilterType = 'test';
        catalogStateSvc.recordSearchText = 'test';
        catalogStateSvc.selectedRecord = {};
        catalogStateSvc.reset();
        expect(catalogStateSvc.totalRecordSize).toEqual(0);
        expect(catalogStateSvc.currentRecordPage).toEqual(1);
        expect(catalogStateSvc.initializeRecordSortOption).toHaveBeenCalled();
        expect(catalogStateSvc.recordFilterType).toEqual('');
        expect(catalogStateSvc.recordSearchText).toEqual('');
        expect(catalogStateSvc.selectedRecord).toBeUndefined();
    });
    describe('should retrieve the icon class for a record', function() {
        it('if the record is an OntologyRecord', function() {
            expect(catalogStateSvc.getRecordIcon({'@type': [prefixes.ontologyEditor + 'OntologyRecord']})).toEqual('fa-sitemap');
        });
        it('if the record is a MappingRecord', function() {
            expect(catalogStateSvc.getRecordIcon({'@type': [prefixes.delim + 'MappingRecord']})).toEqual('fa-map');
        });
        it('if the record is a DatasetRecord', function() {
            expect(catalogStateSvc.getRecordIcon({'@type': [prefixes.dataset + 'DatasetRecord']})).toEqual('fa-database');
        });
        it('if the record is not a specified type', function() {
            expect(catalogStateSvc.getRecordIcon({})).toEqual('fa-book');
        });
    })
});