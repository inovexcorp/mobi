describe('Create User Overlay component', function() {
    var $compile, $q, scope, userManagerSvc, userStateSvc;

    beforeEach(function() {
        module('templates');
        module('createUserOverlay');
        injectRegexConstant();
        mockUserManager();
        mockUserState();

        inject(function( _$compile_, _$rootScope_, _$q_, _userManagerService_, _userStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
        });

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-user-overlay close="close()" dismiss="dismiss()"></create-user-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createUserOverlay');
    });

    afterEach(function() {
        $compile = null;
        $q = null;
        scope = null;
        userManagerSvc = null;
        userStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should get the list of used usernames', function() {
            userManagerSvc.users = [{username: 'user'}];
            var usernames = this.controller.getUsernames();
            expect(usernames.length).toEqual(userManagerSvc.users.length);
            _.forEach(usernames, (username, idx) => {
                expect(username).toEqual(userManagerSvc.users[idx].username);
            });
        });
        describe('should add a user with the entered information', function() {
            beforeEach(function() {
                this.controller.newUser = {username: 'username', firstName: 'John', lastName: "Doe", email: 'example@example.com', roles: ['user']};
                this.controller.password = 'password';
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUser.and.returnValue($q.reject('Error Message'));
                this.controller.add();
                scope.$apply()
                expect(userManagerSvc.addUser).toHaveBeenCalledWith(this.controller.newUser, this.controller.password);
                expect(this.controller.errorMessage).toEqual('Error Message');
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                this.controller.roles.admin = true;
                this.controller.add();
                scope.$apply();
                expect(userManagerSvc.addUser).toHaveBeenCalledWith(this.controller.newUser, this.controller.password);
                expect(this.controller.errorMessage).toEqual('');
                expect(scope.close).toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CREATE-USER-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['form', 'custom-label', 'password-confirm-input', 'email-input', 'permissions-input'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with text-inputs', function() {
            expect(this.element.find('text-input').length).toEqual(2);
        });
        it('with the correct classes based on the username field validity', function() {
            scope.$digest();
            var usernameInput = angular.element(this.element.querySelectorAll('.username input')[0]);
            expect(usernameInput.hasClass('is-invalid')).toEqual(false);

            this.controller.newUser.username = '$';
            this.controller.form.username.$setDirty();
            scope.$digest();
            expect(usernameInput.hasClass('is-invalid')).toEqual(true);
        });
        it('with the correct classes based on the info form validity', function() {
            this.controller.form.$invalid = false;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.form.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with the correct classes based on the permission form validity', function() {
            this.controller.form.$invalid = false;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.form.$setValidity('test', false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toEqual(0);

            this.controller.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var cancelButton = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        cancelButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
    it('should call add when the submit button is clicked', function() {
        spyOn(this.controller, 'add');
        var addButton = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        addButton.triggerHandler('click');
        expect(this.controller.add).toHaveBeenCalled();
    });
});