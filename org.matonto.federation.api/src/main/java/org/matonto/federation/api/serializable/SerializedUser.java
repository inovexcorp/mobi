package org.matonto.federation.api.serializable;

import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.rdf.api.ValueFactory;

import java.io.Serializable;

public class SerializedUser implements Serializable, Comparable<SerializedUser> {
    private static final long serialVersionUID = 0l;

    private final String userIRI;
    private final String username;

    public SerializedUser(String userIRI, String username) {
        this.userIRI = userIRI;
        this.username = username;
    }

    public SerializedUser(User user) {
        this.userIRI = user.getResource().stringValue();
        this.username = user.getUsername().isPresent() ? user.getUsername().get().stringValue() : "";
    }

    public String getUserIRI() {
        return userIRI;
    }

    public String getUsername() {
        return username;
    }

    @Override
    public int compareTo(SerializedUser other) {
        return this.userIRI.compareTo(other.userIRI);
    }

    public static User getAsUser(SerializedUser serializedUser, UserFactory factory, ValueFactory vf) {
        User user = factory.createNew(vf.createIRI(serializedUser.userIRI));
        user.setUsername(vf.createLiteral(serializedUser.username));
        return user;
    }
}
