describe('Branches To Display Filter', function() {
    var $filter, catalogManagerSvc, utilSvc, loginManagerSvc, prefixes;

    beforeEach(function() {
        module('branchesToDisplay');
        mockLoginManager();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$filter_, _catalogManagerService_, _utilService_, _loginManagerService_, _prefixes_) {
            $filter = _$filter_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            loginManagerSvc = _loginManagerService_;
            prefixes = _prefixes_;
        });

        this.baseBranch = {
            '@id': 'branch1',
            '@type': [prefixes.catalog + 'Branch'],
            [prefixes.dcterms + 'title']: [{'@value': 'branch1'}]
        };

        this.userBranch1 = {
            '@id': 'user1branch1',
            '@type': [prefixes.catalog + 'UserBranch', prefixes.catalog + 'Branch'],
            [prefixes.dcterms + 'publisher']: [{'@id': 'user1'}],
            [prefixes.catalog + 'createdFrom']: [{'@id': 'branch1'}],
            [prefixes.dcterms + 'title']: [{'@value': 'branch1'}]
        };

        this.userBranch2 = {
            '@id': 'user2branch1',
            '@type': [prefixes.catalog + 'UserBranch', prefixes.catalog + 'Branch'],
            [prefixes.dcterms + 'publisher']: [{'@id': 'user2'}],
            [prefixes.catalog + 'createdFrom']: [{'@id': 'branch1'}],
            [prefixes.dcterms + 'title']: [{'@value': 'branch1'}]
        };

        this.normalBranch = {
            '@id': 'branch2',
            '@type': [prefixes.catalog + 'Branch'],
            [prefixes.dcterms + 'title']: [{'@value': 'branch2'}]
        };

        this.otherThing = {
            '@id': 'other'
        };

        this.branches = [this.baseBranch, this.userBranch1, this.userBranch2, this.normalBranch, this.otherThing];
        catalogManagerSvc.isBranch.and.callFake(branch => _.includes(_.get(branch, '@type'), prefixes.catalog + 'Branch'));
        catalogManagerSvc.isUserBranch.and.callFake(branch => _.includes(_.get(branch, '@type'), prefixes.catalog + 'UserBranch'));

        utilSvc.getDctermsId.and.callFake((entity, property) => _.get(entity, "['" + prefixes.dcterms + property + "'][0]['@id']", ''));
        utilSvc.getDctermsValue.and.callFake((entity, property) => _.get(entity, "['" + prefixes.dcterms + property + "'][0]['@id']", ''));
        utilSvc.getPropertyId.and.callFake((entity, propertyIRI) => _.get(entity, "['" + propertyIRI + "'][0]['@id']", ''));
    });

    afterEach(function() {
        $filter = null;
        catalogManagerSvc = null;
        utilSvc = null;
        loginManagerSvc = null;
        prefixes = null;
    });

    it('returns non user branches when the user does not have user branch', function() {
        loginManagerSvc.currentUserIRI = 'user3';
        var result;
        result = $filter('branchesToDisplay')(this.branches);
        expect(result.length).toBe(3);
        expect(_.some(result, {'@id': 'branch1'})).toBeTruthy();
        expect(_.some(result, {'@id': 'branch2'})).toBeTruthy();
        expect(_.some(result, {'@id': 'other'})).toBeTruthy();
    });
    it('returns user1branch1 and a non user branch when the user has a user branch', function() {
        loginManagerSvc.currentUserIRI = 'user1';
        var result;
        result = $filter('branchesToDisplay')(this.branches);
        expect(result.length).toBe(3);
        expect(_.some(result, {'@id': 'user1branch1'})).toBeTruthy();
        expect(_.some(result, {'@id': 'branch2'})).toBeTruthy();
        expect(_.some(result, {'@id': 'other'})).toBeTruthy();
    });
    it('returns user2branch1 and a non user branch when the user has a user branch', function() {
        loginManagerSvc.currentUserIRI = 'user2';
        var result;
        result = $filter('branchesToDisplay')(this.branches);
        expect(result.length).toBe(3);
        expect(_.some(result, {'@id': 'user2branch1'})).toBeTruthy();
        expect(_.some(result, {'@id': 'branch2'})).toBeTruthy();
        expect(_.some(result, {'@id': 'other'})).toBeTruthy();
    });
});
