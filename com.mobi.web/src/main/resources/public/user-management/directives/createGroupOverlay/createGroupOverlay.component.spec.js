describe('Create Group Overlay component', function() {
    var $compile, scope, $q, userManagerSvc, loginManagerSvc;

    beforeEach(function() {
        module('templates');
        module('createGroupOverlay');
        mockUserManager();
        mockLoginManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _loginManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
        });

        loginManagerSvc.currentUser = 'user';
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-group-overlay close="close()" dismiss="dismiss()"></create-group-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createGroupOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        loginManagerSvc = null;
        this.element.remove();
    });

    it('should intialize with the correct value for members', function() {
        expect(this.controller.newGroup.members).toContain(loginManagerSvc.currentUser);
    });
    describe('controller bound variable', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should get the list of used group titles', function() {
            userManagerSvc.groups = [{title: 'group'}];
            var titles = this.controller.getTitles();
            expect(titles.length).toEqual(userManagerSvc.groups.length);
            _.forEach(titles, function(title, idx) {
                expect(title).toEqual(userManagerSvc.groups[idx].title);
            });
        });
        describe('should add a group with the entered information', function() {
            beforeEach(function() {
                this.controller.newGroup = {title: 'title', description: 'Description', members: ['user']};
            });
            it('unless an error occurs', function() {
                userManagerSvc.addGroup.and.returnValue($q.reject('Error Message'));
                this.controller.add();
                scope.$apply();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(this.controller.newGroup);
                expect(this.controller.errorMessage).toEqual('Error Message');
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                this.controller.add();
                scope.$apply();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(this.controller.newGroup);
                expect(this.controller.errorMessage).toEqual('');
                expect(scope.close).toHaveBeenCalled();
            });
        });
        it('should add a member to the new group', function() {
            this.controller.addMember('John');
            expect(this.controller.newGroup.members).toContain('John');
        });
        it('should remove a member from the new group', function() {
            this.controller.removeMember('user');
            expect(this.controller.newGroup.members).not.toContain('user');
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CREATE-GROUP-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['form', 'member-table', 'text-area'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('depending on the title field validity', function() {
            scope.$digest();
            var titleInput = angular.element(this.element.querySelectorAll('.title input')[0]);
            expect(titleInput.hasClass('is-invalid')).toEqual(false);

            this.controller.form.title.$setDirty();
            this.controller.form.title.$touched = true;
            scope.$digest();
            expect(titleInput.hasClass('is-invalid')).toEqual(true);
        });
        it('depending on the form validity', function() {
            this.controller.form.$invalid = false;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.form.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toEqual(0);
            this.controller.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('with buttons to cancel and add', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call add when the submit button is clicked', function() {
        this.controller.name = 'group';
        spyOn(this.controller, 'add');
        scope.$digest();

        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.add).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var cancelButton = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        cancelButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});