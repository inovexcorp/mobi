package org.matonto.jaas.rest.providers;

/*-
 * #%L
 * org.matonto.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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


import aQute.bnd.annotation.component.Component;
import net.sf.json.JSONObject;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.orm.Thing;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.Iterator;
import java.util.Optional;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Provider;

@Provider
@Component(
        immediate = true,
        properties = {"providerSubject=User"}
        )
@Produces(MediaType.APPLICATION_JSON)
public class UserProvider implements MessageBodyWriter<User> {
    @Override
    public boolean isWriteable(Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return type == User.class || Arrays.asList(someClass.getGenericInterfaces()).contains(User.class);
    }

    @Override
    public long getSize(User user, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return 0;
    }

    @Override
    public void writeTo(User user, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType,
                        MultivaluedMap<String, Object> multivaluedMap, OutputStream outputStream)
            throws IOException, WebApplicationException {
        JSONObject object = new JSONObject();
        Optional<Literal> usernameOpt = user.getUsername();
        Iterator<Literal> firstNameIt = user.getFirstName().iterator();
        Iterator<Literal> lastNameIt = user.getLastName().iterator();
        Iterator<Thing> emailIt = user.getMbox().iterator();
        object.put("username", usernameOpt.isPresent() ? usernameOpt.get().stringValue() : "");
        object.put("firstName", firstNameIt.hasNext() ? firstNameIt.next().stringValue() : "");
        object.put("lastName", lastNameIt.hasNext() ? lastNameIt.next().stringValue() : "");
        object.put("email", emailIt.hasNext() ? emailIt.next().getResource().stringValue() : "");

        outputStream.write(object.toString().getBytes());
    }
}
