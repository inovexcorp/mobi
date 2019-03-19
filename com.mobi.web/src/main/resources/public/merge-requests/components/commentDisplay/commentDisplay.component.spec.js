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
describe('Comment Display component', function() {
    var $compile, scope, $q, mergeRequestManagerSvc, userManagerSvc, loginManagerSvc, utilSvc, modalSvc, showdown;

    beforeEach(function() {
        module('templates');
        module('merge-requests');
        injectShowdownConstant();
        injectTrustedFilter();
        mockMergeRequestManager();
        mockUserManager();
        mockLoginManager();
        mockUtil();
        mockPrefixes();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestManagerService_, _userManagerService_, _loginManagerService_, _utilService_, _modalService_, _showdown_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            utilSvc = _utilService_;
            modalSvc = _modalService_;
            showdown = _showdown_;
        });

        this.userId = 'user';
        this.username = 'username';
        utilSvc.getDctermsId.and.returnValue(this.userId);
        utilSvc.getDctermsValue.and.callFake((obj, prop) => prop);
        userManagerSvc.users = [{iri: this.userId, username: this.username}];

        scope.request = {jsonld: {'@id': 'request'}};
        scope.comment = {'@id': 'comment'};
        scope.isReply = true;
        this.element = $compile(angular.element('<comment-display request="request" comment="comment" is-reply="isReply"></comment-display>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commentDisplay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestManagerSvc = null;
        userManagerSvc = null;
        loginManagerSvc = null;
        utilSvc = null;
        modalSvc = null;
        showdown = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('request should be two way bound', function() {
            this.controller.request = {};
            scope.$digest();
            expect(scope.request).toEqual({});
        });
        it('comment should be one way bound', function() {
            this.controller.comment = {};
            scope.$digest();
            expect(scope.comment).toEqual({'@id': 'comment'});
        });
        it('isReply should be one way bound', function() {
            this.controller.isReply = false;
            scope.$digest();
            expect(scope.isReply).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('should get the name of the creator of the comment', function() {
            it('if the user is found', function() {
                expect(this.controller.getCreator()).toEqual(this.username);
                expect(utilSvc.getDctermsId).toHaveBeenCalledWith(this.controller.comment, 'creator');
            });
            it('if the user is not found', function() {
                userManagerSvc.users = [];
                expect(this.controller.getCreator()).toEqual('(Unknown)');
                expect(utilSvc.getDctermsId).toHaveBeenCalledWith(this.controller.comment, 'creator');
            });
        });
        it('should get the comment rendered as HTML Markdown', function() {
            this.controller.converter.makeHtml.and.returnValue('WOW');
            expect(this.controller.getComment()).toEqual('WOW');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.controller.comment, 'description');
            expect(this.controller.converter.makeHtml).toHaveBeenCalledWith('description');
        });
        it('should get the issued date of the comment', function() {
            expect(this.controller.getIssued()).toEqual('issued');
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.controller.comment, 'issued');
        });
        it('should determine whether the current user is the creator of the comment', function() {
            expect(this.controller.isCreator()).toEqual(false);
            loginManagerSvc.currentUserIRI = this.userId;
            expect(this.controller.isCreator()).toEqual(true);
        });
        it('should open a confirm comment delete modal', function() {
            this.controller.confirmDelete();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure'), this.controller.deleteComment);
        });
        describe('should delete the comment', function() {
            describe('if deleteComment resolves', function() {
                it('and getComments resolves', function() {
                    mergeRequestManagerSvc.getComments.and.returnValue($q.when([{}]));
                    this.controller.deleteComment();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.deleteComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.controller.comment['@id']);
                    expect(mergeRequestManagerSvc.getComments).toHaveBeenCalledWith(this.controller.request.jsonld['@id']);
                    expect(this.controller.request.comments).toEqual([{}]);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless getComments rejects', function() {
                    mergeRequestManagerSvc.getComments.and.returnValue($q.reject('Error message'));
                    this.controller.deleteComment();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.deleteComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.controller.comment['@id']);
                    expect(mergeRequestManagerSvc.getComments).toHaveBeenCalledWith(this.controller.request.jsonld['@id']);
                    expect(this.controller.request.comments).toBeUndefined();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                });
            });
            it('unless deleteComment rejects', function() {
                mergeRequestManagerSvc.deleteComment.and.returnValue($q.reject('Error message'));
                this.controller.deleteComment();
                scope.$apply();
                expect(mergeRequestManagerSvc.deleteComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.controller.comment['@id']);
                expect(mergeRequestManagerSvc.getComments).not.toHaveBeenCalled();
                expect(this.controller.request.comments).toBeUndefined();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('COMMENT-DISPLAY');
            expect(this.element.querySelectorAll('.comment-display').length).toEqual(1);
            expect(this.element.querySelectorAll('.comment-title').length).toEqual(1);
            expect(this.element.querySelectorAll('.comment-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.comment-body-text').length).toEqual(1);
        });
        it('if the comment is a reply', function() {
            var title = angular.element(this.element.querySelectorAll('.comment-title')[0]);
            expect(title.html()).toContain('replied');
            expect(title.html()).not.toContain('commented');

            this.controller.isReply = false;
            scope.$digest();
            expect(title.html()).not.toContain('replied');
            expect(title.html()).toContain('commented');
        });
        it('if the current user is the creator', function() {
            spyOn(this.controller, 'isCreator').and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.comment-body button').length).toEqual(0);

            this.controller.isCreator.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.comment-body button').length).toEqual(1);
        });
        it('if the request is accepted', function() {
            spyOn(this.controller, 'isCreator').and.returnValue(true);
            mergeRequestManagerSvc.isAccepted.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.comment-body button').length).toEqual(0);

            mergeRequestManagerSvc.isAccepted.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.comment-body button').length).toEqual(1);
        });
    });
});