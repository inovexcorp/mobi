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
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.rdf.api.ValueFactory;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.*;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Provider;

@Provider
@Component(
        immediate = true,
        properties = {"providerSubject=Set<Role>"}
        )
@Produces(MediaType.APPLICATION_JSON)
public class RoleSetProvider implements MessageBodyWriter<Set<Role>> {
    protected ValueFactory factory;
    protected RoleProvider roleProvider;

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference(target = "(providerSubject=Role)")
    public void setRoleProvider(MessageBodyWriter roleProvider) {
        this.roleProvider = (RoleProvider) roleProvider;
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
            return roleProvider.isWriteable(Class.forName(subType.getTypeName()), subType, annotations, mediaType);
        } catch (ClassNotFoundException ex) {
            return false;
        }
    }

    @Override
    public long getSize(Set<Role> roles, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return 0;
    }

    @Override
    public void writeTo(Set<Role> roles, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType,
                        MultivaluedMap<String, Object> multivaluedMap, OutputStream outputStream)
            throws IOException, WebApplicationException {
        outputStream.write("[".getBytes());
        Iterator<Role> roleIt = roles.iterator();
        while (roleIt.hasNext()) {
            Role role = roleIt.next();
            roleProvider.writeTo(role, role.getClass(), role.getClass().getGenericSuperclass(), annotations, mediaType,
                    multivaluedMap, outputStream);
            if (roleIt.hasNext()) {
                outputStream.write(", ".getBytes());
            }
        }
        outputStream.write("]".getBytes());
    }
}
