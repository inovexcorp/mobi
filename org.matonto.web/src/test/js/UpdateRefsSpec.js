describe('Update Refs service', function() {
    var updateRefsSvc,
        responseObjSvc;

    beforeEach(function() {
        module('responseObj');
        module('updateRefs');

        module(function($provide) {
            $provide.value('splitIRIFilter', jasmine.createSpy('splitIRIFilter').and.callFake(function(iri) {
                return {
                    begin: 'aaa',
                    then: '/',
                    end: '1'
                }
            }));
        });

        inject(function(updateRefsService, _responseObj_) {
            updateRefsSvc = updateRefsService;
            responseObjSvc = _responseObj_;
            spyOn(responseObjSvc, 'getItemIri').and.callFake(function(obj) {
                return _.get(obj, 'iri', '');
            });
            spyOn(responseObjSvc, 'validateItem').and.callFake(function(obj) {
                return typeof obj === 'object';
            });
        });
    });

    it('should replace all instances of a key in an object with the new key', function() {
        var result,
            obj = {
                'test/0': 0,
                'id': 'test/0',
                props: [
                    {
                        'test/0': 1
                    }
                ],
                refs: ['test/0'],
                items: [
                    {
                        iri: 'test/0',
                        namespace: 'test/',
                        localName: '0'
                    }
                ]
            },
            result = {
                'aaa/1': 0,
                'id': 'aaa/1',
                props: [
                    {
                        'aaa/1': 1
                    }
                ],
                refs: ['aaa/1'],
                items: [
                    {
                        iri: 'test/0',
                        namespace: 'aaa/',
                        localName: '1'
                    }
                ]
            };
        updateRefsSvc.update(obj, 'test/0', 'aaa/1');
        expect(obj).toEqual(result);
    });
});