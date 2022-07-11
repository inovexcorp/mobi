package com.mobi.document.translator.rest;

/*-
 * #%L
 * com.mobi.document.translator.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertEquals;

import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.expression.DefaultIriExpressionProcessor;
import com.mobi.document.translator.impl.csv.CsvSemanticTranslator;
import com.mobi.document.translator.impl.xml.XmlStackingSemanticTranslator;
import com.mobi.document.translator.stack.impl.json.JsonStackingSemanticTranslator;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.ValueFactory;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import org.junit.BeforeClass;
import org.junit.Test;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class DocumentTranslatorRestTest extends MobiRestTestCXF {
    private static DocumentTranslatorRest rest;

    @BeforeClass
    public static void startServer() throws Exception {
        rest = new DocumentTranslatorRest();
        injectOrmFactoryReferencesIntoService(rest);

        ModelFactory mf = getModelFactory();
        ValueFactory vf = getValueFactory();

        DefaultIriExpressionProcessor processor = new DefaultIriExpressionProcessor();
        injectOrmFactoryReferencesIntoService(processor);

        JsonStackingSemanticTranslator json = new JsonStackingSemanticTranslator();
        injectOrmFactoryReferencesIntoService(json);
        json.setExpressionProcessor(processor);
        json.setOrmFactoryRegistry(getOrmFactoryRegistry());

        XmlStackingSemanticTranslator xml = new XmlStackingSemanticTranslator();
        injectOrmFactoryReferencesIntoService(xml);
        xml.setExpressionProcessor(processor);
        xml.setOrmFactoryRegistry(getOrmFactoryRegistry());

        CsvSemanticTranslator csv = new CsvSemanticTranslator();
        injectOrmFactoryReferencesIntoService(csv);
        csv.setExpressionProcessor(processor);
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
        configureServer(rest, new com.mobi.rest.test.util.UsernameTestFilter());
    }

    @Test
    public void testSuccessJson() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.bodyPart("file", "test.json", getClass().getResourceAsStream("/test.json"));

        Response response = target().path("translate").request().post(Entity.entity(formData.body(),
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testSuccessXml() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.bodyPart("file", "test.xml", getClass().getResourceAsStream("/test.xml"));

        Response response = target().path("translate").request().post(Entity.entity(formData.body(),
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testSuccessCSV() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.bodyPart("file", "test.csv", getClass().getResourceAsStream("/test.csv"));

        Response response = target().path("translate").request().post(Entity.entity(formData.body(),
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testInvalidType() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.field("type", "xml");
        formData.bodyPart("file", "test.csv", getClass().getResourceAsStream("/test.csv"));

        Response response = target().path("translate").request()
                .post(Entity.entity(formData.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void testInvalidDesiredRows() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.field("desiredRows", "invalid");
        formData.bodyPart("file", "test.csv", getClass().getResourceAsStream("/test.csv"));

        Response response = target().path("translate").request()
                .post(Entity.entity(formData.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void testValidDesiredRows() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.field("desiredRows", "8");
        formData.bodyPart("file", "test.csv", getClass().getResourceAsStream("/test.csv"));

        Response response = target().path("translate").request()
                .post(Entity.entity(formData.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testInvalidFile() {
        FormDataMultiPart formData = new FormDataMultiPart();
        formData.bodyPart("file", "test.docx", getClass().getResourceAsStream("/test.docx"));

        Response response = target().path("translate").request().post(Entity.entity(formData.body(),
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);
    }

    private static Field getField(Class<?> clazz, String name) throws Exception {
        Field f = clazz.getDeclaredField(name);
        f.setAccessible(true);
        return f;
    }

}
