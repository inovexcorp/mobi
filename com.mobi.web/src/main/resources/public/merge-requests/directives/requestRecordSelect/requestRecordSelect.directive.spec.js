describe('Request Record Select directive', function() {
    var $compile, scope, $q, catalogManagerSvc, mergeRequestsStateSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('requestRecordSelect');
        mockCatalogManager();
        mockMergeRequestsState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _mergeRequestsStateService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        this.headers = {'x-total-count': 3};
        this.getResponse = {data: [{'@id': '1'}, {'@id': '2'}, {'@id': '3'}], headers: jasmine.createSpy('headers').and.returnValue(this.headers)};
        catalogManagerSvc.getRecords.and.returnValue($q.when(this.getResponse));
        utilSvc.getResultsPage.and.returnValue($q.when(this.getResponse));
        catalogManagerSvc.sortOptions = [{field: prefixes.dcterms + 'title', asc: true}];
        this.element = $compile(angular.element('<request-record-select></request-record-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('requestRecordSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        mergeRequestsStateSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should select a record', function() {
            this.controller.selectRecord({'@id': 'record'});
            expect(mergeRequestsStateSvc.requestConfig.recordId).toEqual('record');
            expect(mergeRequestsStateSvc.requestConfig.record).toEqual({'@id': 'record'});
        });
        describe('should set the list of records', function() {
            it('successfully', function() {
                this.controller.setRecords();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith('catalogId', this.controller.config);
                expect(angular.copy(this.controller.records)).toEqual([[{'@id': '1'}, {'@id': '2'}], [{'@id': '3'}]]);
                expect(this.controller.totalSize).toEqual(3);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error Message'));
                this.controller.setRecords();
                scope.$apply();
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith('catalogId', this.controller.config);
                expect(this.controller.records).toEqual([]);
                expect(this.controller.totalSize).toEqual(0);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
        it('should set the initial page of records', function() {
            spyOn(this.controller, 'setRecords');
            this.controller.currentPage = 10;
            this.controller.setInitialRecords();
            expect(this.controller.currentPage).toEqual(1);
            expect(this.controller.setRecords).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('request-record-select')).toEqual(true);
            expect(this.element.querySelectorAll('.record-search-form').length).toEqual(1);
            expect(this.element.querySelectorAll('.records').length).toEqual(1);
            expect(this.element.querySelectorAll('.paging-container').length).toEqual(1);
        });
        it('with an input for the search text', function() {
            expect(this.element.querySelectorAll('.record-search-form input').length).toEqual(1);
        });
        it('with a paging-details', function() {
            expect(this.element.find('paging-details').length).toEqual(1);
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toEqual(1);
        });
        it('depending on how many records there are', function() {
            this.controller.records = [[{'@id': '1'}, {'@id': '2'}], [{'@id': '3'}]];
            scope.$digest();
            expect(this.element.querySelectorAll('.records .row').length).toEqual(this.controller.records.length);
            expect(this.element.querySelectorAll('.records .record.card-container').length).toEqual(_.flatten(this.controller.records).length);
        });
        it('depending on whether a record is selected', function() {
            this.controller.records = [[{'@id': 'record'}]];
            scope.$digest();
            var card = angular.element(this.element.querySelectorAll('.records md-card')[0]);
            expect(card.hasClass('selected')).toEqual(false);

            mergeRequestsStateSvc.requestConfig.recordId = 'record';
            scope.$digest();
            expect(card.hasClass('selected')).toEqual(true);
        });
    });
    it('should call setRecords when the search button is clicked', function() {
        spyOn(this.controller, 'setRecords');
        var button = angular.element(this.element.querySelectorAll('.record-search-form button')[0]);
        button.triggerHandler('click');
        expect(this.controller.setRecords).toHaveBeenCalled();
    });
    it('should select a record when it is clicked', function() {
        this.controller.records = [[{'@id': 'record'}]];
        scope.$digest();
        spyOn(this.controller, 'selectRecord');

        var card = angular.element(this.element.querySelectorAll('.records md-card')[0]);
        card.triggerHandler('click');
        expect(this.controller.selectRecord).toHaveBeenCalledWith({'@id': 'record'});
    });
});
