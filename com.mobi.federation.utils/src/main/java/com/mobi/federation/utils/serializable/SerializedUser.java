package com.mobi.federation.utils.serializable;

/*-
 * #%L
 * com.mobi.federation.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.rdf.api.ValueFactory;

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
