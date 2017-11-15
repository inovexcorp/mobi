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
import org.apache.commons.lang3.builder.CompareToBuilder;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import java.io.Serializable;

public class SerializedUser implements Serializable, Comparable<SerializedUser> {
    private static final long serialVersionUID = -3946720548062730139L;

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
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (obj == this) {
            return true;
        }
        if (obj.getClass() != getClass()) {
            return false;
        }
        SerializedUser other = (SerializedUser) obj;
        return new EqualsBuilder()
                .appendSuper(super.equals(obj))
                .append(userIRI, other.userIRI)
                .append(username, other.username)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(userIRI)
                .append(username)
                .toHashCode();
    }

    @Override
    public int compareTo(SerializedUser other) {
        return new CompareToBuilder()
                .append(this.userIRI, other.userIRI)
                .append(this.username, other.username)
                .toComparison();
    }

    public static User getAsUser(SerializedUser serializedUser, UserFactory factory, ValueFactory vf) {
        User user = factory.createNew(vf.createIRI(serializedUser.userIRI));
        user.setUsername(vf.createLiteral(serializedUser.username));
        return user;
    }
}
