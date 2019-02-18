describe('Update Refs service', function() {
    var updateRefsSvc;

    beforeEach(function() {
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

        inject(function(updateRefsService) {
            updateRefsSvc = updateRefsService;
        });
    });

    afterEach(function() {
        updateRefsSvc = null;
    });

    it('should replace all instances of a key in an object with the new key', function() {
            var obj = {
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
                ],
                test: {
                    'test/0': 'something'
                }
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
                        iri: 'aaa/1',
                        namespace: 'test/',
                        localName: '0'
                    }
                ],
                test: {
                    'aaa/1': 'something'
                }
            };
        updateRefsSvc.update(obj, 'test/0', 'aaa/1');
        expect(obj).toEqual(result);
    });
    it('should replace all nested instances of a key in an object with the new key.', function() {
            var obj = {
                'test/0': {
                    'test/0': {
                        'label': 'label',
                        'ontologyIri': 'test/0'
                    }
                },
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
                'aaa/1': {
                    'aaa/1': {
                        'label': 'label',
                        'ontologyIri': 'aaa/1'
                    }
                },
                'id': 'aaa/1',
                props: [
                    {
                        'aaa/1': 1
                    }
                ],
                refs: ['aaa/1'],
                items: [
                    {
                        iri: 'aaa/1',
                        namespace: 'test/',
                        localName: '0'
                    }
                ]
            };
        updateRefsSvc.update(obj, 'test/0', 'aaa/1');
        expect(obj).toEqual(result);
    });
    it('should remove all objects that reference the provided string', function() {
        var obj = {
            'id1': 'remove',
            arr: [
                {
                    'id2': 'remove'
                }
            ],
            arr2: [
                {
                    'id3': 'remove',
                    '$$hashKey': true
                },
                {
                    'id4': 'no-remove'
                }
            ],
            arr3: ['remove', 'no-remove'],
            arr4: ['remove'],
            'id5': {
                'id6': 'remove',
                '$$hashKey': true
            }
        };
        var result = {
            arr2: [
                {
                    'id4': 'no-remove'
                }
            ],
            arr3: ['no-remove']
        };
        updateRefsSvc.remove(obj, 'remove');
        expect(obj).toEqual(result);
    });
});
