describe('Search Form directive', function() {
    var $compile, scope, $q, searchSvc, discoverStateSvc, exploreSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('searchForm');
        mockDiscoverState();
        mockSearch();
        mockExplore();
        mockUtil();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _searchService_, _discoverStateService_, _exploreService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            searchSvc = _searchService_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            modalSvc = _modalService_;
        });

        discoverStateSvc.search.queryConfig.filters = [{
            title: 'title',
            range: 'range',
            display: 'display'
        }];

        this.element = $compile(angular.element('<search-form></search-form>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('searchForm');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        searchSvc = null;
        discoverStateSvc = null;
        exploreSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should open the propertyFilterOverlay', function() {
            this.controller.createPropertyFilter();
            expect(modalSvc.openModal).toHaveBeenCalledWith('propertyFilterOverlay');
        });
        describe('should submit the search query', function() {
            beforeEach(function() {
                discoverStateSvc.search.results = {};
            });
            it('unless an error occurs', function() {
                searchSvc.submitSearch.and.returnValue($q.reject('Error Message'));
                this.controller.submit();
                scope.$apply();
                expect(searchSvc.submitSearch).toHaveBeenCalledWith(discoverStateSvc.search.datasetRecordId, discoverStateSvc.search.queryConfig);
                expect(this.controller.errorMessage).toEqual('Error Message');
                expect(discoverStateSvc.search.results).toBeUndefined();
            });
            it('and set the results', function() {
                searchSvc.submitSearch.and.returnValue($q.when({head: {}}));
                this.controller.submit();
                scope.$apply();
                expect(searchSvc.submitSearch).toHaveBeenCalledWith(discoverStateSvc.search.datasetRecordId, discoverStateSvc.search.queryConfig);
                expect(this.controller.errorMessage).toEqual('');
                expect(discoverStateSvc.search.results).toEqual({head: {}});
            });
        });
        describe('getTypes calls the proper method when getClassDetails', function() {
            beforeEach(function() {
                discoverStateSvc.search.datasetRecordId = 'id';
                discoverStateSvc.search.typeObject = {key: []};
                discoverStateSvc.search.properties = [{}];
            });
            it('resolves', function() {
                exploreSvc.getClassDetails.and.returnValue($q.when([{ontologyRecordTitle: 'title', prop: 'details'}]));
                this.controller.getTypes();
                scope.$apply();
                expect(discoverStateSvc.resetSearchQueryConfig).toHaveBeenCalled();
                expect(discoverStateSvc.search.properties).toBeUndefined();
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('id');
                expect(angular.copy(discoverStateSvc.search.typeObject)).toEqual({title: [{ontologyRecordTitle: 'title', prop: 'details'}]});
                expect(this.controller.errorMessage).toBe('');
            });
            it('rejects', function() {
                exploreSvc.getClassDetails.and.returnValue($q.reject('error'));
                this.controller.getTypes();
                scope.$apply();
                expect(discoverStateSvc.resetSearchQueryConfig).toHaveBeenCalled();
                expect(discoverStateSvc.search.properties).toBeUndefined();
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('id');
                expect(discoverStateSvc.search.typeObject).toEqual({});
                expect(this.controller.errorMessage).toBe('error');
            });
        });
        describe('getSelectedText returns the correct text when queryConfig.types', function() {
            it('is empty', function() {
                expect(this.controller.getSelectedText()).toBe('');
            });
            it('has values', function() {
                discoverStateSvc.search.queryConfig.types = [{classTitle: 'title1'}, {classTitle: 'title2'}];
                expect(this.controller.getSelectedText()).toBe('title1, title2');
            });
        });
        it('removeFilter should remove the filter associated with the provided index', function() {
            var data = [{
                prop: 'removed'
            }, {
                prop: 'saved'
            }];
            var expected = [{
                prop: 'saved'
            }];
            discoverStateSvc.search.queryConfig.filters = angular.copy(data);
            this.controller.removeFilter(0);
            expect(discoverStateSvc.search.queryConfig.filters).toEqual(expected);
        });
        describe('isSubmittable should return the correct boolean value when', function() {
            it('dataset is not selected', function() {
                discoverStateSvc.search.datasetRecordId = undefined;
                expect(this.controller.isSubmittable()).toBeFalsy();
            });
            describe('dataset is selected and', function() {
                beforeEach(function() {
                    discoverStateSvc.search.datasetRecordId = 'id';
                    discoverStateSvc.search.queryConfig = {
                        filters: [],
                        keywords: [],
                        types: []
                    };
                });
                it('nothing else', function() {
                    expect(this.controller.isSubmittable()).toBeFalsy();
                });
                it('a keyword is set', function() {
                    discoverStateSvc.search.queryConfig.keywords = ['keyword'];
                    expect(this.controller.isSubmittable()).toBeTruthy();
                });
                it('a type is set', function() {
                    discoverStateSvc.search.queryConfig.types = ['type'];
                    expect(this.controller.isSubmittable()).toBeTruthy();
                });
                it('a filter is set', function() {
                    discoverStateSvc.search.queryConfig.filters = [{prop: 'filter'}];
                    expect(this.controller.isSubmittable()).toBeTruthy();
                });
            });
        });
        it('getLast should return the last element of the array', function() {
            expect(this.controller.getLast([0, 1])).toBe(1);
        });
        describe('refresh should set the variable correctly and call the correct method when datasetRecordId is', function() {
            beforeEach(function() {
                discoverStateSvc.search.properties = [{}];
                spyOn(this.controller, 'getTypes');
            });
            it('empty', function() {
                discoverStateSvc.search.datasetRecordId = '';
                this.controller.refresh();
                expect(this.controller.getTypes).not.toHaveBeenCalled();
            });
            it('populated', function() {
                discoverStateSvc.search.datasetRecordId = 'id';
                this.controller.refresh();
                expect(this.controller.getTypes).toHaveBeenCalled();
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('search-form')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('with a .strike', function() {
            expect(this.element.querySelectorAll('.strike').length).toEqual(3);
        });
        it('with a .dataset-wrapper', function() {
            expect(this.element.querySelectorAll('.dataset-wrapper').length).toEqual(1);
        });
        it('with a dataset-form-group', function() {
            expect(this.element.find('dataset-form-group').length).toEqual(1);
        });
        it('with a .refresh-link', function() {
            expect(this.element.querySelectorAll('.refresh-link').length).toEqual(1);
        });
        it('with a .fa-refresh', function() {
            expect(this.element.querySelectorAll('.fa-refresh').length).toEqual(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toEqual(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toEqual(3);
        });
        it('with a md-chips', function() {
            expect(this.element.find('md-chips').length).toEqual(1);
        });
        it('with a .properties-container', function() {
            expect(this.element.querySelectorAll('.properties-container').length).toEqual(1);
        });
        it('with a .header-wrapper', function() {
            expect(this.element.querySelectorAll('.header-wrapper').length).toEqual(1);
        });
        it('with a .property-link', function() {
            expect(this.element.querySelectorAll('.property-link').length).toEqual(1);
        });
        it('with a md-list', function() {
            expect(this.element.find('md-list').length).toEqual(1);
        });
        it('with a md-list-item', function() {
            expect(this.element.find('md-list-item').length).toEqual(1);
        });
        it('with a .md-list-item-text', function() {
            expect(this.element.querySelectorAll('.md-list-item-text').length).toEqual(1);
        });
        it('with a .md-list-item-text h3', function() {
            expect(this.element.querySelectorAll('.md-list-item-text h3').length).toEqual(1);
        });
        it('with .md-list-item-text ps', function() {
            expect(this.element.querySelectorAll('.md-list-item-text p').length).toEqual(2);
        });
        it('with a .md-list-item-text md-icon', function() {
            expect(this.element.querySelectorAll('.md-list-item-text md-icon').length).toEqual(1);
        });
        it('with a .btn-primary', function() {
            expect(this.element.querySelectorAll('.btn-primary').length).toBe(1);
        });
        it('with a .btn-container .btn-link', function() {
            expect(this.element.querySelectorAll('.btn-container .btn-link').length).toBe(1);
        });
        it('depending on whether an error has occurred', function() {
            expect(this.element.find('error-display').length).toEqual(0);
            this.controller.errorMessage = 'Test';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
    });
});
