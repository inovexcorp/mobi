describe('Merge Request Discussion component', function() {
    var $compile, scope, $q, mergeRequestManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('mergeRequestDiscussion');
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
        this.element = $compile(angular.element('<merge-request-discussion request="request"></merge-request-discussion>'))(scope);
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
        it('request should be two way bound', function() {
            this.controller.request = {};
            scope.$digest();
            expect(scope.request).toEqual({});
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