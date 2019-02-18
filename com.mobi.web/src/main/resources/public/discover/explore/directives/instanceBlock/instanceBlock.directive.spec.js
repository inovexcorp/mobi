describe('Instance Block directive', function() {
    var $compile, scope, $q, discoverStateSvc, $httpBackend, exploreSvc, utilSvc, uuid, splitIRI;

    beforeEach(function() {
        module('templates');
        module('instanceBlock');
        mockDiscoverState();
        mockExplore();
        mockUtil();
        injectSplitIRIFilter();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _discoverStateService_, _$httpBackend_, _exploreService_, _utilService_, _uuid_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            discoverStateSvc = _discoverStateService_;
            $httpBackend = _$httpBackend_;
            exploreSvc = _exploreService_;
            utilSvc = _utilService_;
            uuid = _uuid_;
            splitIRI = _splitIRIFilter_;
        });

        this.element = $compile(angular.element('<instance-block></instance-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        discoverStateSvc = null;
        $httpBackend = null;
        exploreSvc = null;
        utilSvc = null;
        uuid = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a breadcrumbs', function() {
            expect(this.element.find('breadcrumbs').length).toBe(1);
        });
        it('with a button', function() {
            expect(this.element.find('button').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.querySelectorAll('block-content').length).toBe(1);
        });
        it('with a instance-cards', function() {
            expect(this.element.find('instance-cards').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details.float-left', function() {
            expect(this.element.querySelectorAll('paging-details.float-left').length).toBe(1);
        });
        it('with a pagination.float-right', function() {
            expect(this.element.querySelectorAll('pagination.float-right').length).toBe(1);
        });
        it('with a paging-details.float-left', function() {
            expect(this.element.querySelectorAll('paging-details.float-left').length).toBe(1);
        });
        it('with a pagination.float-right', function() {
            expect(this.element.querySelectorAll('pagination.float-right').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('setPage should call the correct methods when getClassInstanceDetails', function() {
            beforeEach(function() {
                exploreSvc.createPagedResultsObject.and.returnValue({prop: 'paged', currentPage: 1});
            });
            it('resolves', function() {
                exploreSvc.getClassInstanceDetails.and.returnValue($q.when({}));
                this.controller.setPage();
                scope.$apply();
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {limit: discoverStateSvc.explore.instanceDetails.limit, offset: (discoverStateSvc.explore.instanceDetails.currentPage - 1) * discoverStateSvc.explore.instanceDetails.limit});
                expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith({});
                expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({prop: 'paged', currentPage: 1}));
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('rejects', function() {
                exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('Error'));
                this.controller.setPage();
                scope.$apply();
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {limit: discoverStateSvc.explore.instanceDetails.limit, offset: (discoverStateSvc.explore.instanceDetails.currentPage - 1) * discoverStateSvc.explore.instanceDetails.limit});
                expect(exploreSvc.createPagedResultsObject).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error');
            });
        });
        it('create should set the correct variables', function() {
            discoverStateSvc.explore.creating = false;
            discoverStateSvc.explore.instanceDetails.data = [{instanceIRI: 'instanceIRI'}];
            discoverStateSvc.explore.classId = 'classId';
            splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
            this.controller.create();
            expect(discoverStateSvc.explore.creating).toBe(true);
            expect(splitIRI).toHaveBeenCalledWith('instanceIRI');
            expect(uuid.v4).toHaveBeenCalled();
            expect(discoverStateSvc.explore.instance.entity[0]['@id']).toContain('begin/');
            expect(discoverStateSvc.explore.instance.entity[0]['@type']).toEqual(['classId']);
            expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('New Instance');
            expect(discoverStateSvc.explore.instance.metadata.instanceIRI).toEqual('begin/');
        });
        it('getClassName should return the correct value', function() {
            discoverStateSvc.explore.breadcrumbs = ['not-this', 'class'];
            expect(this.controller.getClassName()).toBe('class');
        });
        it('button should say [Deprecated] if the class is deprecated', function() {
            expect(angular.element(this.element.find('button')[0]).text().trim()).not.toContain('[Deprecated]');
            discoverStateSvc.explore.classDeprecated = true;
            scope.$apply();
            expect(angular.element(this.element.find('button')[0]).text().trim()).toContain('[Deprecated]');
        });
    });
});