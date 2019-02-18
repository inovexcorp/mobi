describe('Reply Comment component', function() {
    var $compile, scope, $q, mergeRequestManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('replyComment');
        mockMergeRequestManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            utilSvc = _utilService_;
        });

        scope.request = {jsonld: {'@id': 'request'}};
        scope.parentId = 'comment';
        this.element = $compile(angular.element('<reply-comment request="request" parent-id="parentId"></reply-comment>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('replyComment');
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
        it('parentId should be one way bound', function() {
            this.controller.parentId = '';
            scope.$digest();
            expect(scope.parentId).toEqual('comment');
        });
    });
    describe('controller methods', function() {
        describe('should reply to the parent comment', function() {
            beforeEach(function() {
                this.controller.edit = true;
                this.replyComment = 'WOW';
                this.controller.replyComment = this.replyComment;
            });
            describe('if createComment resolves', function() {
                it('and getComments resolves', function() {
                    mergeRequestManagerSvc.getComments.and.returnValue($q.when([[{}]]));
                    this.controller.reply();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.createComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.replyComment, this.controller.parentId);
                    expect(this.controller.edit).toEqual(false);
                    expect(this.controller.replyComment).toEqual('');
                    expect(mergeRequestManagerSvc.getComments).toHaveBeenCalledWith(this.controller.request.jsonld['@id']);
                    expect(this.controller.request.comments).toEqual([[{}]]);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless getComments rejects', function() {
                    mergeRequestManagerSvc.getComments.and.returnValue($q.reject('Error message'));
                    this.controller.reply();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.createComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.replyComment, this.controller.parentId);
                    expect(this.controller.edit).toEqual(false);
                    expect(this.controller.replyComment).toEqual('');
                    expect(mergeRequestManagerSvc.getComments).toHaveBeenCalledWith(this.controller.request.jsonld['@id']);
                    expect(this.controller.request.comments).toBeUndefined();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                });
            });
            it('unless createComment rejects', function() {
                mergeRequestManagerSvc.createComment.and.returnValue($q.reject('Error message'));
                this.controller.reply();
                scope.$apply();
                expect(mergeRequestManagerSvc.createComment).toHaveBeenCalledWith(this.controller.request.jsonld['@id'], this.replyComment, this.controller.parentId);
                expect(this.controller.edit).toEqual(true);
                expect(this.controller.replyComment).toEqual('WOW');
                expect(mergeRequestManagerSvc.getComments).not.toHaveBeenCalled();
                expect(this.controller.request.comments).toBeUndefined();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
        });
        it('should cancel the reply', function() {
            this.controller.edit = true;
            this.controller.replyComment = 'test';
            this.controller.cancel();
            expect(this.controller.edit).toEqual(false);
            expect(this.controller.replyComment).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('REPLY-COMMENT');
            expect(this.element.querySelectorAll('.reply-comment').length).toEqual(1);
        });
        it('depending on whether the reply is being edited', function() {
            expect(this.element.querySelectorAll('.reply-box').length).toEqual(1);
            expect(this.element.find('markdown-editor').length).toEqual(0);

            this.controller.edit = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.reply-box').length).toEqual(0);
            expect(this.element.find('markdown-editor').length).toEqual(1);
        });
    });
});