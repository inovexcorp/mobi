package org.matonto.etl.rest;


import java.util.Collection;
import java.util.Map;
import java.util.Random;
import java.util.TreeMap;

/**
 * A {@link org.matonto.etl.rest.User} service which we rest enable the routes defined in the XML file.
 */
public class UserService {

    // use a tree map so they become sorted
    private final Map<String, User> users = new TreeMap<String, User>();

    private Random ran = new Random();

    public UserService() {
        users.put("123", new User(123, "John Doe"));
        users.put("456", new User(456, "Donald Duck"));
        users.put("789", new User(789, "Slow Turtle"));
    }

    /**
     * Gets a user by the given id
     *
     * @param id  the id of the user
     * @return the user, or <tt>null</tt> if no user exists
     */
    public User getUser(String id) {
        if ("789".equals(id)) {
            // simulate some cpu processing time when returning the slow turtle
            int delay = 500 + ran.nextInt(1500);
            try {
                Thread.sleep(delay);
            } catch (Exception e) {
                // ignore
            }
        }
        return users.get(id);
    }

    /**
     * List all users
     *
     * @return the list of all users
     */
    public Collection<User> listUsers() {
        return users.values();
    }

    /**
     * Updates or creates the given user
     *
     * @param user the user
     */
    public void updateUser(User user) {
        users.put("" + user.getId(), user);
    }
}