describe('Policy Manager service', function() {
    var policyManagerSvc, $q, $httpBackend, $httpParamSerializer, utilSvc;

    beforeEach(function() {
        module('policyManager');
        mockUtil();
        injectRestPathConstant();
        mockPrefixes();

        inject(function(policyManagerService, _$q_, _$httpBackend_, _$httpParamSerializer_, _utilService_) {
            policyManagerSvc = policyManagerService;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            utilSvc = _utilService_;
        });

        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        this.policy = {PolicyId: 'id'};
    });

    afterEach(function() {
        policyManagerSvc = null;
        $q = null;
        $httpBackend = null;
        $httpParamSerializer = null
        utilSvc = null;
    });

    describe('should retrieve a list of policies', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/policies').respond(400, null, null, 'Error Message');
            policyManagerSvc.getPolicies()
                .then(function(value) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/policies').respond(200, []);
            policyManagerSvc.getPolicies()
                .then(function(value) {
                    expect(value).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('with filters', function() {
            var config = {
                relatedResource: 'resource',
                relatedSubject: 'subject',
                relatedAction: 'action'
            };
            $httpBackend.whenGET('/mobirest/policies?' + $httpParamSerializer(config)).respond(200, []);
            policyManagerSvc.getPolicies(config.relatedResource, config.relatedSubject, config.relatedAction)
                .then(function(value) {
                    expect(value).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a policy', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/policies/' + this.policy.PolicyId).respond(400, null, null, 'Error Message');
            policyManagerSvc.getPolicy(this.policy.PolicyId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.whenGET('/mobirest/policies/' + this.policy.PolicyId).respond(200, this.policy);
            policyManagerSvc.getPolicy(this.policy.PolicyId)
                .then(function(response) {
                    expect(response).toEqual(this.policy);
                }.bind(this), function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a policy', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenPUT('/mobirest/policies/' + this.policy.PolicyId,
                function(data) {
                    return _.isEqual(data, JSON.stringify(this.policy));
                }.bind(this)).respond(400, null, null, 'Error Message');
            policyManagerSvc.updatePolicy(this.policy)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('when resolved', function() {
            $httpBackend.whenPUT('/mobirest/policies/' + this.policy.PolicyId,
                function(data) {
                    return _.isEqual(data, JSON.stringify(this.policy));
                }.bind(this)).respond(200);
            policyManagerSvc.updatePolicy(this.policy)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
});
