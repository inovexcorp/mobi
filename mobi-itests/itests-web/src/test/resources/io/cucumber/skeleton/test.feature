Feature: Initial Browser test

  Scenario: Mobi Smoke Test
    Given I navigate to the Mobi login page
    When I log in with the "admin" username and "admin" password
    And the "Home" page's action elements are visible
    And I navigate to the "Catalog" page
    And the "Catalog" page's action elements are visible
    And I navigate to the "Ontology Editor" page
    And the "Ontology Editor" page's action elements are visible
    And I navigate to the "Merge Requests" page
    And the "Merge Requests" page's action elements are visible
    And I navigate to the "Mapping Tool" page
    And the "Mapping Tool" page's action elements are visible
    And I navigate to the "Datasets" page
    And the "Datasets" page's action elements are visible
    And I navigate to the "Discover" page
    And the "Discover" page's action elements are visible
    And the user clicks the Logout link on the sidebar
