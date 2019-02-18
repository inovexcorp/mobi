describe('Username Search filter', function() {
    var $filter;
    var user1 = {username: 'testUsername', firstName: 'testFirstName', lastName: 'testLastName'};
    var user2 = {username: 'seconduser', firstName: 'secondfirst', lastName: 'secondlast'};
    var user3 = {username: 'thirduser', firstName: 'no', lastName: ''};
    var user4 = {username: 'fourthuser', firstName: '', lastName: 'onlylast'};
    var users = [user1, user2, user3, user4];

    beforeEach(function() {
        module('usernameSearch');

        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    it('returns all users when search string is empty', function() {
        var result;
        result = $filter('usernameSearch')(users, '');
        expect(result).toEqual(users);
    });
    it('returns all users when search string does not exist', function() {
        var result;
        result = $filter('usernameSearch')(users);
        expect(result).toEqual(users);
    });
    it('returns no users when search string does not match any users', function() {
        var result;
        result = $filter('usernameSearch')(users, 'thisstringdoesnotmatch');
        expect(result).toEqual([]);
    });
    it('returns all users when search string matches all users', function() {
        var result;
        result = $filter('usernameSearch')(users, 'user');
        expect(result).toEqual(users);
    });
    it('returns one user when search string matches only first name', function() {
        var result;
        result = $filter('usernameSearch')(users, 'testFirst');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches only last name', function() {
        var result;
        result = $filter('usernameSearch')(users, 'testLast');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches only username', function() {
        var result;
        result = $filter('usernameSearch')(users, 'testuser');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches firstName lastName', function() {
        var result;
        result = $filter('usernameSearch')(users, 'FirstName testLast');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches lastName firstName', function() {
        var result;
        result = $filter('usernameSearch')(users, 'LastName testFirst');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches lastName, firstName', function() {
        var result;
        result = $filter('usernameSearch')(users, 'LastName, testFirst');
        expect(result).toEqual([user1]);
    });
    it('returns one user when search string matches but casing is different', function() {
        var result;
        result = $filter('usernameSearch')(users, 'LaStNaMe TeStFiRsT');
        expect(result).toEqual([user1]);
    });
    it('returns two of four users when search string matches two users', function() {
        var result;
        result = $filter('usernameSearch')(users, 'first');
        expect(result).toEqual([user1, user2]);
    });
});