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
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.orm.Thing;
import org.matonto.rest.util.ErrorUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Optional;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.MessageBodyReader;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Provider;

@Provider
@Component(
        immediate = true,
        properties = {"providerSubject=User"}
        )
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserProvider implements MessageBodyWriter<User>, MessageBodyReader<User> {
    protected EngineManager engineManager;
    private static final String RDF_ENGINE = "org.matonto.jaas.engines.RdfEngine";

    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Override
    public boolean isWriteable(Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return isUser(someClass, type);
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

    @Override
    public boolean isReadable(Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return isUser(someClass, type);
    }

    @Override
    public User readFrom(Class<User> someClass, Type type, Annotation[] annotations, MediaType mediaType,
                         MultivaluedMap<String, String> multivaluedMap, InputStream inputStream)
            throws IOException, WebApplicationException {
        JSONObject input = JSONObject.fromObject(IOUtils.toString(inputStream, "UTF-8"));
        if (!input.containsKey("username")) {
            throw ErrorUtils.sendError("User must have a username", Response.Status.BAD_REQUEST);
        }
        UserConfig config = new UserConfig.Builder(input.getString("username"), "", new HashSet<>())
                .email(input.containsKey("email") ? input.getString("email") : "")
                .firstName(input.containsKey("firstName") ? input.getString("firstName") : "")
                .lastName(input.containsKey("lastName") ? input.getString("lastName") : "")
                .build();

        return engineManager.createUser(RDF_ENGINE, config);
    }

    private boolean isUser(Class<?> someClass, Type type) {
        return type == User.class || Arrays.asList(someClass.getGenericInterfaces()).contains(User.class);
    }
}
