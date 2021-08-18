package com.mobi.document.translator.rest;

/*-
 * #%L
 * com.mobi.document.translator.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getOrmFactoryRegistry;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static org.testng.Assert.assertEquals;

import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.expression.DefaultIriExpressionProcessor;
import com.mobi.document.translator.impl.csv.CsvSemanticTranslator;
import com.mobi.document.translator.impl.xml.XmlStackingSemanticTranslator;
import com.mobi.document.translator.stack.impl.json.JsonStackingSemanticTranslator;
import com.mobi.persistence.utils.impl.SimpleSesameTransformer;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Test;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class DocumentTranslatorRestTest extends MobiRestTestNg {
    private DocumentTranslatorRest rest;

    @Override
    public Application configureApp() throws Exception {
        rest = new DocumentTranslatorRest();
        injectOrmFactoryReferencesIntoService(rest);

        ModelFactory mf = getModelFactory();
        ValueFactory vf = getValueFactory();

        DefaultIriExpressionProcessor processor = new DefaultIriExpressionProcessor();
        injectOrmFactoryReferencesIntoService(processor);
        processor.setValueFactory(vf);

        JsonStackingSemanticTranslator json = new JsonStackingSemanticTranslator();
        injectOrmFactoryReferencesIntoService(json);
        json.setExpressionProcessor(processor);
        json.setModelFactory(mf);
        json.setValueFactory(vf);
        json.setOrmFactoryRegistry(getOrmFactoryRegistry());

        XmlStackingSemanticTranslator xml = new XmlStackingSemanticTranslator();
        injectOrmFactoryReferencesIntoService(xml);
        xml.setExpressionProcessor(processor);
        xml.setModelFactory(mf);
        xml.setValueFactory(vf);
        xml.setOrmFactoryRegistry(getOrmFactoryRegistry());

        CsvSemanticTranslator csv = new CsvSemanticTranslator();
        injectOrmFactoryReferencesIntoService(csv);
        csv.setExpressionProcessor(processor);
        csv.setModelFactory(mf);
        csv.setValueFactory(vf);
        csv.setOrmFactoryRegistry(getOrmFactoryRegistry());

        Field f = rest.getClass().getDeclaredField("translators");
        f.setAccessible(true);
        List<SemanticTranslator> translators = new ArrayList<>();
        translators.add(json);
        translators.add(xml);
        translators.add(csv);
        f.set(rest, translators);

        getField(rest.getClass(), "valueFactory").set(rest, vf);
        getField(rest.getClass(), "modelFactory").set(rest, mf);
        getField(rest.getClass(), "ormFactoryRegistry").set(rest, getOrmFactoryRegistry());
        getField(rest.getClass(), "sesameTransformer").set(rest, new SimpleSesameTransformer());
        
        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class)
                .register(UsernameTestFilter.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @Test
    public void testSuccessJson() {
        FormDataMultiPart formData = new FormDataMultiPart();
        FormDataContentDisposition disposition = FormDataContentDisposition
                .name("file")
                .fileName("test.json")
                .build();

        FormDataBodyPart bodyPart = new FormDataBodyPart(disposition, getClass().getResourceAsStream("/test.json"),
                MediaType.APPLICATION_OCTET_STREAM_TYPE);

        formData.bodyPart(bodyPart);

        Response response = target().path("translate").request().post(Entity.entity(formData,
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testSuccessXml() {
        FormDataMultiPart formData = new FormDataMultiPart();
        FormDataContentDisposition disposition = FormDataContentDisposition
                .name("file")
                .fileName("test.xml")
                .build();

        FormDataBodyPart bodyPart = new FormDataBodyPart(disposition, getClass().getResourceAsStream("/test.xml"),
                MediaType.APPLICATION_OCTET_STREAM_TYPE);

        formData.bodyPart(bodyPart);

        Response response = target().path("translate").request().post(Entity.entity(formData,
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testSuccessCSV() {
        FormDataMultiPart formData = new FormDataMultiPart();
        FormDataContentDisposition disposition = FormDataContentDisposition
                .name("file")
                .fileName("test.csv")
                .build();

        FormDataBodyPart bodyPart = new FormDataBodyPart(disposition, getClass().getResourceAsStream("/test.csv"),
                MediaType.APPLICATION_OCTET_STREAM_TYPE);

        formData.bodyPart(bodyPart);

        Response response = target().path("translate").request().post(Entity.entity(formData,
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testInvalidType() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.field("type", "xml");

        FormDataContentDisposition disposition = FormDataContentDisposition
                .name("file")
                .fileName("test.csv")
                .build();

        FormDataBodyPart bodyPart = new FormDataBodyPart(disposition, getClass().getResourceAsStream("/test.csv"),
                MediaType.APPLICATION_OCTET_STREAM_TYPE);

        formData.bodyPart(bodyPart);

        Response response = target().path("translate").request()
                .post(Entity.entity(formData, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void testInvalidDesiredRows() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.field("desiredRows", "invalid");
        FormDataContentDisposition disposition = FormDataContentDisposition
                .name("file")
                .fileName("test.csv")
                .build();

        FormDataBodyPart bodyPart = new FormDataBodyPart(disposition, getClass().getResourceAsStream("/test.csv"),
                MediaType.APPLICATION_OCTET_STREAM_TYPE);

        formData.bodyPart(bodyPart);

        Response response = target().path("translate").request()
                .post(Entity.entity(formData, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testValidDesiredRows() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.field("desiredRows", "8");

        FormDataContentDisposition disposition = FormDataContentDisposition
                .name("file")
                .fileName("test.csv")
                .build();

        FormDataBodyPart bodyPart = new FormDataBodyPart(disposition, getClass().getResourceAsStream("/test.csv"),
                MediaType.APPLICATION_OCTET_STREAM_TYPE);

        formData.bodyPart(bodyPart);

        Response response = target().path("translate").request()
                .post(Entity.entity(formData, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testInvalidFile() {
        FormDataMultiPart formData = new FormDataMultiPart();
        FormDataContentDisposition disposition = FormDataContentDisposition
                .name("file")
                .fileName("test.docx")
                .build();

        FormDataBodyPart bodyPart = new FormDataBodyPart(disposition, getClass().getResourceAsStream("/test.docx"),
                MediaType.APPLICATION_OCTET_STREAM_TYPE);

        formData.bodyPart(bodyPart);

        Response response = target().path("translate").request().post(Entity.entity(formData,
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);
    }

    private static Field getField(Class<?> clazz, String name) throws Exception {
        Field f = clazz.getDeclaredField(name);
        f.setAccessible(true);
        return f;
    }

}
