/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Profile Tab component', function() {
    var $compile, scope, $q, userManagerSvc, loginManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('settings');
        mockUserManager();
        mockLoginManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _loginManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            prefixes = _prefixes_;
        });

        loginManagerSvc.currentUser = 'user';
        userManagerSvc.users = [{
            jsonld: {
                [prefixes.foaf + 'firstName']: [{'@value': 'John'}],
                [prefixes.foaf + 'lastName']: [{'@value': 'Doe'}],
                [prefixes.foaf + 'mbox']: [{'@id': 'john.doe@gmail.com'}]
            },
            username: 'user',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gmail.com'
        }];
        this.element = $compile(angular.element('<profile-tab></profile-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('profileTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        loginManagerSvc = null;
        prefixes = null;
        this.element.remove();
    });

    it('should initialize with the current user', function() {
        expect(this.controller.currentUser).not.toBe(userManagerSvc.users[0]);
        expect(this.controller.currentUser).toEqual(userManagerSvc.users[0]);
    });
    describe('controller methods', function() {
        describe('should save changes to the user profile', function() {
            it('unless an error occurs', function() {
                userManagerSvc.updateUser.and.returnValue($q.reject('Error message'));
                this.controller.save();
                scope.$apply();
                expect(userManagerSvc.updateUser).toHaveBeenCalledWith(loginManagerSvc.currentUser, userManagerSvc.users[0]);
                expect(this.controller.success).toEqual(false);
                expect(this.controller.errorMessage).toEqual('Error message');
            });
            it('successfully', function() {
                this.controller.save();
                scope.$apply();
                expect(userManagerSvc.updateUser).toHaveBeenCalledWith(loginManagerSvc.currentUser, userManagerSvc.users[0]);
                expect(this.controller.success).toEqual(true);
                expect(this.controller.errorMessage).toEqual('');
                expect(this.controller.form.$pristine).toEqual(true);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PROFILE-TAB');
            expect(this.element.querySelectorAll('.profile-tab').length).toEqual(1);
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-6').length).toEqual(1);
            expect(this.element.querySelectorAll('.offset-3').length).toEqual(1);
        });
        ['block', 'block-content', 'block-footer', 'email-input'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with text-inputs', function() {
            expect(this.element.find('text-input').length).toEqual(2);
        });
        it('depending on whether the password was saved successfully', function() {
            expect(this.element.querySelectorAll('.text-success').length).toEqual(0);

            this.controller.success = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.text-success').length).toEqual(1);
        });
        it('depending on the form validity and dirtiness', function() {
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeTruthy();

            this.controller.form.$setDirty();
            scope.$digest();
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeFalsy();
        });
        it('depending on whether the current user is external', function() {
            this.controller.form.$setDirty();
            this.controller.form.$invalid = false;
            scope.$digest();
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeFalsy();

            this.controller.currentUser.external = true;
            scope.$digest();
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeTruthy();

            this.controller.currentUser.external = false;
            scope.$digest();
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeFalsy();
        });
    });
    it('should save changes when the save button is clicked', function() {
        spyOn(this.controller, 'save');
        var button = angular.element(this.element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(this.controller.save).toHaveBeenCalled();
    });
});