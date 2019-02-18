describe('Login controller', function() {
    var $controller, scope, $q, loginManagerSvc;

    beforeEach(function() {
        module('login');
        mockLoginManager();

        inject(function(_$rootScope_, _$controller_, _loginManagerService_, _$q_) {
            scope = _$rootScope_;
            $controller = _$controller_;
            loginManagerSvc = _loginManagerService_;
            $q = _$q_;
        });

        this.controller = $controller('LoginController', {});
    });

    afterEach(function() {
        $controller = null;
        scope = null;
        $q = null;
        loginManagerSvc = null;
    });

    describe('correctly validates a login combination', function() {
        beforeEach(function() {
            this.controller.form = {
                username: 'user',
                password: ''
            };
        });
        it('unless an error occurs', function() {
            loginManagerSvc.login.and.returnValue($q.reject('Error message'));
            this.controller.login();
            scope.$digest();
            expect(loginManagerSvc.login).toHaveBeenCalledWith(this.controller.form.username, this.controller.form.password);
            expect(this.controller.errorMessage).toBe('Error message');
        });
        it('successfully', function() {
            this.controller.login();
            scope.$digest();
            expect(loginManagerSvc.login).toHaveBeenCalledWith(this.controller.form.username, this.controller.form.password);
            expect(this.controller.errorMessage).toBe('');
        });
    });
});