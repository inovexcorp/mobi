describe('Record Permissions service', function() {
    var recordPermissionsSvc, utilSvc, scope, $httpBackend, $httpParamSerializer, $q;

    beforeEach(function() {
        module('recordPermissionsManager');
        mockUtil();
        injectRestPathConstant();
        mockPrefixes();

        inject(function(recordPermissionsManagerService, _utilService_,  _$rootScope_, _$httpBackend_, _$httpParamSerializer_, _$q_) {
            recordPermissionsSvc = recordPermissionsManagerService;
            utilSvc = _utilService_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        this.recordId = 'id';
        this.policy = {};
    });

    afterEach(function() {
        scope = null;
        $httpBackend = null;
        $httpParamSerializer = null
        $q = null;
    });

    describe('should retrieve a record policy json representation', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/record-permissions/' + this.recordId).respond(400, null, null, 'Error Message');
            recordPermissionsSvc.getRecordPolicy(this.recordId)
                .then(() => fail('Promise should have rejected'), (response) => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/record-permissions/' + this.recordId).respond(200, this.policy);
            recordPermissionsSvc.getRecordPolicy(this.recordId)
                .then((response) => expect(response).toEqual(this.policy), () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a record policy with the json representation', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenPUT('/mobirest/record-permissions/' + this.recordId, (data) => _.isEqual(data, JSON.stringify(this.policy)))
                .respond(400, null, null, 'Error Message');
            recordPermissionsSvc.updateRecordPolicy(this.recordId, this.policy)
                .then(() => fail('Promise should have rejected'), (response) => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('when resolved', function() {
            $httpBackend.whenPUT('/mobirest/record-permissions/' + this.recordId, data => _.isEqual(data, JSON.stringify(this.policy)))
                .respond(200);
            recordPermissionsSvc.updateRecordPolicy(this.recordId, this.policy)
                .then(_.noop,() => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
});
