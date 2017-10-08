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
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import com.mobi.jaas.engines.RdfEngine;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import org.openrdf.model.vocabulary.DCTERMS;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;
import java.util.Arrays;
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
        properties = {"providerSubject=Group"}
        )
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GroupProvider implements MessageBodyWriter<Group>, MessageBodyReader<Group> {
    protected ValueFactory factory;
    protected EngineManager engineManager;

    @Reference
    public void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Override
    public boolean isWriteable(Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return isGroup(someClass, type);
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

    @Override
    public boolean isReadable(Class<?> someClass, Type type, Annotation[] annotations, MediaType mediaType) {
        return isGroup(someClass, type);
    }

    @Override
    public Group readFrom(Class<Group> someClass, Type type, Annotation[] annotations, MediaType mediaType,
                          MultivaluedMap<String, String> multivaluedMap, InputStream inputStream)
            throws IOException, WebApplicationException {
        JSONObject input = JSONObject.fromObject(IOUtils.toString(inputStream, "UTF-8"));
        if (!input.containsKey("title")) {
            throw ErrorUtils.sendError("Group must have a title", Response.Status.BAD_REQUEST);
        }
        GroupConfig config = new GroupConfig.Builder(input.getString("title"))
                .description(input.containsKey("description") ? input.getString("description") : "")
                .build();

        return engineManager.createGroup(RdfEngine.COMPONENT_NAME, config);
    }

    private boolean isGroup(Class<?> someClass, Type type) {
        return type == Group.class || Arrays.asList(someClass.getGenericInterfaces()).contains(Group.class);
    }
}
