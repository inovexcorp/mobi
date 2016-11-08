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
import org.matonto.jaas.api.ontologies.usermanagement.Group;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.openrdf.model.vocabulary.DCTERMS;

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
        properties = {"providerSubject=Group"}
        )
@Produces(MediaType.APPLICATION_JSON)
public class GroupProvider implements MessageBodyWriter<Group> {
    protected ValueFactory factory;

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Override
    public boolean isWriteable(Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return type == Group.class || Arrays.asList(someClass.getGenericInterfaces()).contains(Group.class);
    }

    @Override
    public long getSize(Group group, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return 0;
    }

    @Override
    public void writeTo(Group group, Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType,
                        MultivaluedMap<String, Object> multivaluedMap, OutputStream outputStream)
            throws IOException, WebApplicationException {
        JSONObject object = new JSONObject();
        Optional<Value> titleOpt = group.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue()));
        Optional<Value> descriptionOpt = group.getProperty(factory.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        object.put("title", titleOpt.isPresent() ? titleOpt.get().stringValue() : "");
        object.put("description", descriptionOpt.isPresent() ? descriptionOpt.get().stringValue() : "");
        
        outputStream.write(object.toString().getBytes());
    }
}
