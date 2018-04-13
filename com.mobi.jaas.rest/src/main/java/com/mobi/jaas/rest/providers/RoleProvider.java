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
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;
import java.util.Arrays;
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
        properties = {"providerSubject=Role"}
        )
@Produces(MediaType.APPLICATION_JSON)
public class RoleProvider implements MessageBodyWriter<Role> {
    protected ValueFactory factory;

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Override
    public boolean isWriteable(Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return isRole(someClass, type);
    }

    @Override
    public long getSize(Role role, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return 0;
    }

    @Override
    public void writeTo(Role role, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType,
                        MultivaluedMap<String, Object> multivaluedMap, OutputStream outputStream)
            throws IOException, WebApplicationException {
        Optional<Value> titleOpt = role.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue()));
        if (titleOpt.isPresent()) {
            outputStream.write(("\"" + titleOpt.get().stringValue() + "\"").getBytes());
        }
    }

    private boolean isRole(Class<?> someClass, Type type) {
        return type == Role.class || Arrays.asList(someClass.getGenericInterfaces()).contains(Role.class);
    }
}
