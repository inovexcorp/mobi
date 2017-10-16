package com.mobi.jaas.rest.providers;

/*-
 * #%L
 * com.mobi.jaas.rest
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
import com.mobi.jaas.api.ontologies.usermanagement.User;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Provider;

@Provider
@Component(
        immediate = true,
        properties = {"providerSubject=Set<User>"}
        )
@Produces(MediaType.APPLICATION_JSON)
public class UserSetProvider implements MessageBodyWriter<Set<User>> {
    protected UserProvider userProvider;

    @Reference(target = "(providerSubject=User)")
    public void setUserProvider(MessageBodyWriter userProvider) {
        this.userProvider = (UserProvider) userProvider;
    }

    @Override
    public boolean isWriteable(Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        ParameterizedType parameterizedType = (ParameterizedType) type;
        if (parameterizedType.getRawType() != Set.class || parameterizedType.getActualTypeArguments().length == 0) {
            return false;
        }
        try {
            List<Type> types = Arrays.asList(parameterizedType.getActualTypeArguments());
            if (types.size() == 0) {
                return false;
            }
            Type subType = types.get(0);
            return userProvider.isWriteable(Class.forName(subType.getTypeName()), subType, annotations, mediaType);
        } catch (ClassNotFoundException ex) {
            return false;
        }
    }

    @Override
    public long getSize(Set<User> users, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return 0;
    }

    @Override
    public void writeTo(Set<User> users, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType,
                        MultivaluedMap<String, Object> multivaluedMap, OutputStream outputStream)
            throws IOException, WebApplicationException {
        outputStream.write("[".getBytes());
        Iterator<User> userIt = users.iterator();
        while (userIt.hasNext()) {
            User user = userIt.next();
            userProvider.writeTo(user, user.getClass(), user.getClass().getGenericSuperclass(), annotations,
                    mediaType, multivaluedMap, outputStream);
            if (userIt.hasNext()) {
                outputStream.write(", ".getBytes());
            }
        }
        outputStream.write("]".getBytes());
    }
}
