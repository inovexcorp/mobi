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
describe('Merge Request Discussion component', function() {
    var $compile, scope, $q, mergeRequestManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('merge-requests');
        mockComponent('merge-requests', 'commentDisplay');
        mockComponent('merge-requests', 'replyComment');
        mockMergeRequestManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            utilSvc = _utilService_;
        });

        scope.request = {jsonld: {'@id': 'request'}, comments: []};
        scope.updateRequest = jasmine.createSpy('updateRequest');
        this.element = $compile(angular.element('<merge-request-discussion request="request" update-request="updateRequest(value)"></merge-request-discussion>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestDiscussion');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('request should be one way bound', function() {
            var copy = angular.copy(this.controller.request);
            this.controller.request = {};
            scope.$digest();
            expect(scope.request).toEqual(copy);
        });
        it('updateRequest should be called in the parent scope', function() {
            this.controller.updateRequest({value: this.controller.request});
            expect(scope.updateRequest).toHaveBeenCalledWith(this.controller.request);
        });
    });
    describe('controller methods', function() {
        describe('should comment on the request', function() {
            beforeEach(function() {
                this.newComment = 'WOW';
                this.controller.newComment = this.newComment;
            });
            describe('if createComment resolves', function() {
                it('and getComments resolves', function() {
                    mergeRequestManagerSvc.getComments.and.returnValue($q.when([[{'@id': 'comment'}]]));
                    this.controller.comment();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.createComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.newComment);
                    expect(this.controller.newComment).toEqual('');
                    expect(mergeRequestManagerSvc.getComments).toHaveBeenCalledWith(this.controller.request.jsonld['@id']);
                    expect(angular.copy(this.controller.request.comments)).toEqual([[{'@id': 'comment'}]]);
                    expect(scope.updateRequest).toHaveBeenCalledWith(this.controller.request);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless getComments rejects', function() {
                    mergeRequestManagerSvc.getComments.and.returnValue($q.reject('Error message'));
                    this.controller.comment();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.createComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.newComment);
                    expect(this.controller.newComment).toEqual('');
                    expect(mergeRequestManagerSvc.getComments).toHaveBeenCalledWith(this.controller.request.jsonld['@id']);
                    expect(this.controller.request.comments).toEqual([]);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                });
            });
            it('unless createComment rejects', function() {
                mergeRequestManagerSvc.createComment.and.returnValue($q.reject('Error message'));
                this.controller.comment();
                scope.$apply();
                expect(mergeRequestManagerSvc.createComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.newComment);
                expect(this.controller.newComment).toEqual('WOW');
                expect(mergeRequestManagerSvc.getComments).not.toHaveBeenCalled();
                expect(this.controller.request.comments).toEqual([]);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MERGE-REQUEST-DISCUSSION');
            expect(this.element.querySelectorAll('.merge-request-discussion').length).toEqual(1);
        });
        it('with a markdown-editor', function() {
            expect(this.element.find('markdown-editor').length).toEqual(1);
        });
        it('depending on how many comments have been made', function() {
            expect(this.element.querySelectorAll('.comment-chain').length).toEqual(0);
            expect(this.element.find('comment-display').length).toEqual(0);

            this.controller.request.comments = [[{'@id': '0'}, {'@id': '1'}], [{'@id': '2'}]];
            scope.$digest();
            expect(this.element.querySelectorAll('.comment-chain').length).toEqual(2);
            expect(this.element.find('comment-display').length).toEqual(3);
        });
        it('if the request is accepted', function() {
            mergeRequestManagerSvc.isAccepted.and.returnValue(false);
            this.controller.request.comments = [[{'@id': '0'}, {'@id': '1'}], [{'@id': '2'}]];
            scope.$digest();
            expect(this.element.querySelectorAll('.new-comment').length).toEqual(1);
            expect(this.element.find('reply-comment').length).toEqual(2);

            mergeRequestManagerSvc.isAccepted.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.new-comment').length).toEqual(0);
            expect(this.element.find('reply-comment').length).toEqual(0);
        });
    });
});