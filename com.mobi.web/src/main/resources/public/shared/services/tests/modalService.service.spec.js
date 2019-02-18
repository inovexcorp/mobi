describe('Modal service', function() {
    var modalSvc, $uibModal, scope;

    beforeEach(function() {
        module('modal');

        module(function($provide) {
            $provide.service('$uibModal', function($q) {
                this.open = jasmine.createSpy('open').and.returnValue({result: $q.when()});
            });
        });

        inject(function(modalService, _$uibModal_, _$rootScope_) {
            modalSvc = modalService;
            $uibModal = _$uibModal_;
            scope = _$rootScope_;
        });
    });

    afterEach(function() {
        modalSvc = null;
        $uibModal = null;
        scope = null;
    });

    describe('should open the specified modal', function() {
        it('without provided resolve values', function() {
            modalSvc.openModal('testModal');
            expect($uibModal.open).toHaveBeenCalledWith({component: 'testModal', resolve: {}});
        });
        it('with provided resolve values', function() {
            modalSvc.openModal('testModal', {test: 'test'});
            expect($uibModal.open).toHaveBeenCalledWith({component: 'testModal', resolve: {test: jasmine.any(Function)}});
        });
        it('with a onClose function', function() {
            var test = 'test';
            modalSvc.openModal('testModal', undefined, () => test = 'new');
            expect($uibModal.open).toHaveBeenCalledWith({component: 'testModal', resolve: {}});
            scope.$apply();
            expect(test).toEqual('new');
        });
    });
    it('should open a confirmation modal', function() {
        modalSvc.openConfirmModal('<p>testModal</p>', _.noop, _.noop);
        expect($uibModal.open).toHaveBeenCalledWith({component: 'confirmModal', resolve: jasmine.any(Object)});
    });
});