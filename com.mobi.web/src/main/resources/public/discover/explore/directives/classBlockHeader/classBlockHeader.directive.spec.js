describe('Class Block Header directive', function() {
    var $compile, scope, $q, discoverStateSvc, exploreSvc, exploreUtils, util, modalSvc;

    beforeEach(function() {
        module('templates');
        module('classBlockHeader');
        mockDiscoverState();
        mockExplore();
        mockExploreUtils();
        mockUtil();
        mockModal()

        inject(function(_$compile_, _$rootScope_, _$q_, _discoverStateService_, _exploreService_, _exploreUtilsService_, _utilService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            exploreUtils = _exploreUtilsService_;
            util = _utilService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<class-block-header></class-block-header>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classBlockHeader');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        exploreSvc = null;
        discoverStateSvc = null;
        exploreUtils = null;
        util = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('FORM');
            expect(this.element.hasClass('class-block-header')).toBe(true);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a dataset-select', function() {
            expect(this.element.find('dataset-select').length).toBe(1);
        });
        it('with a .btn.btn-primary', function() {
            expect(this.element.querySelectorAll('.btn.btn-primary').length).toBe(1);
        });
        it('with a .fa.fa-refresh', function() {
            expect(this.element.querySelectorAll('.fa.fa-refresh').length).toBe(1);
        });
        it('with a .btn.btn-link', function() {
            expect(this.element.querySelectorAll('.btn.btn-link').length).toBe(1);
        });
        it('with a .fa.fa-plus', function() {
            expect(this.element.querySelectorAll('.fa.fa-plus').length).toBe(1);
        });
        it('depending on whether a dataset is selected', function() {
            var refreshButton = angular.element(this.element.querySelectorAll('.btn.btn-primary')[0]);
            var createButton = angular.element(this.element.querySelectorAll('.btn.btn-link')[0]);
            expect(refreshButton.attr('disabled')).toBeTruthy();
            expect(createButton.attr('disabled')).toBeTruthy();

            discoverStateSvc.explore.recordId = 'dataset';
            scope.$digest();
            expect(refreshButton.attr('disabled')).toBeFalsy();
            expect(createButton.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('showCreate calls the proper methods when getClasses', function() {
            beforeEach(function() {
                discoverStateSvc.explore.recordId = 'recordId';
            });
            it('resolves', function() {
                exploreUtils.getClasses.and.returnValue($q.when([{}]));
                this.controller.showCreate();
                scope.$apply();
                expect(modalSvc.openModal).toHaveBeenCalledWith('newInstanceClassOverlay', {classes: [{}]});
            });
            it('rejects', function() {
                exploreUtils.getClasses.and.returnValue($q.reject('Error message'));
                this.controller.showCreate();
                scope.$apply();
                expect(util.createErrorToast).toHaveBeenCalledWith('Error message');
                expect(modalSvc.openModal).not.toHaveBeenCalled();
            });
        });
        describe('onSelect calls the proper methods when getClassDetails', function() {
            beforeEach(function() {
                discoverStateSvc.explore.recordId = 'recordId';
                discoverStateSvc.explore.classDetails = [{}];
            });
            it('resolves', function() {
                exploreSvc.getClassDetails.and.returnValue($q.when([{prop: 'details'}]));
                this.controller.onSelect();
                scope.$apply();
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('recordId');
                expect(discoverStateSvc.explore.classDetails).toEqual([{prop: 'details'}]);
            });
            it('rejects', function() {
                exploreSvc.getClassDetails.and.returnValue($q.reject('error'));
                this.controller.onSelect();
                scope.$apply();
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('recordId');
                expect(discoverStateSvc.explore.classDetails).toEqual([]);
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
    });
});