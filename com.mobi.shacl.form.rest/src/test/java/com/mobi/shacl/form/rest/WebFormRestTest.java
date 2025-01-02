package com.mobi.shacl.form.rest;

/*-
 * #%L
 * com.mobi.shacl.form.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.shacl.PropertyShape;
import com.mobi.ontologies.shacl.SPARQLConstraintFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.*;
import org.mockito.internal.util.collections.Sets;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public class WebFormRestTest extends MobiRestTestCXF {
    private static WebFormRest rest;
    private static OrmFactory<PropertyShape> propertyShapeFactory;
    private static CatalogConfigProvider configProvider;
    private static EngineManager engineManager;
    private static ValueFactory vf;
    private static ValueConverterRegistry vcr;
    private static SPARQLConstraintFactory sparqlConstraintFactory;
    private static PDP pdp;
    private String propertyShapeWithSparql;
    private String propertyShape;
    private String focusNode;

    @Mock
    private RepositoryConnection mockConnection;

    @Mock
    private Request request;

    @Mock
    private User user;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        vcr = new DefaultValueConverterRegistry();
        sparqlConstraintFactory = new SPARQLConstraintFactory();
        sparqlConstraintFactory.valueConverterRegistry = vcr;
        vcr.registerValueConverter(sparqlConstraintFactory);

        rest = new WebFormRest();
        injectOrmFactoryReferencesIntoService(rest);
        propertyShapeFactory = getRequiredOrmFactory(PropertyShape.class);
        configProvider = mock(CatalogConfigProvider.class);
        engineManager = mock(EngineManager.class);
        pdp = mock(PDP.class);

        rest.configProvider = configProvider;
        rest.engineManager = engineManager;
        rest.pdp = pdp;
        configureServer(rest, new com.mobi.rest.test.util.UsernameTestFilter());
    }

    @Before
    public void setup() {
        MockitoAnnotations.initMocks(this);
        when(configProvider.getRepository()).thenReturn(mock(OsgiRepository.class));
        when(configProvider.getRepository().getConnection()).thenReturn(mockConnection);

        propertyShapeWithSparql = "[{\"@id\":\"http://mobi.com/ontologies/namespace#watchesBranchPropertyShape\"," +
                "\"@type\":[\"http://www.w3.org/ns/shacl#PropertyShape\"],\"http://www.w3.org/ns/shacl#class\":" +
                "[{\"@id\":\"http://mobi.com/ontologies/catalog#Branch\"}],\"http://www.w3.org/ns/shacl#maxCount\":" +
                "[{\"@type\":\"http://www.w3.org/2001/XMLSchema#integer\",\"@value\":\"1\"}],\"http://www.w3.org/ns/shacl#minCount\":" +
                "[{\"@type\":\"http://www.w3.org/2001/XMLSchema#integer\",\"@value\":\"1\"}],\"http://www.w3.org/ns/shacl#nodeKind\":" +
                "[{\"@id\":\"http://www.w3.org/ns/shacl#IRI\"}],\"http://www.w3.org/ns/shacl#path\":" +
                "[{\"@id\":\"http://mobi.com/ontologies/namespace#watchesBranch\"}],\"http://www.w3.org/ns/shacl#sparql\":" +
                "[{\"@id\":\"_:6f104a6b5d3a49dc989d3bd35c3ded274\"}],\"https://mobi.solutions/ontologies/form#usesFormField\":" +
                "[{\"@id\":\"https://mobi.solutions/ontologies/form#AutocompleteInput\"}]}," +
                "{\"@id\":\"_:6f104a6b5d3a49dc989d3bd35c3ded274\",\"@type\":[\"http://www.w3.org/ns/shacl#SPARQLConstraint\"]," +
                "\"http://www.w3.org/ns/shacl#prefixes\":[{\"@id\":\"http://mobi.com/ontologies/namespace#\"}]," +
                "\"http://www.w3.org/ns/shacl#select\":[{\"@value\":\"\\n            SELECT $this ?value\\n " +
                "WHERE {\\n                $this $PATH ?value .\\n                FILTER NOT EXISTS {\\n " +
                "?value ^<http://mobi.com/ontologies/catalog#branch>/^<http://mobi.com/ontologies/namespace#watchesRecord> $this ." +
                "\\n                }\\n            }\\n  \\t\\t\"}]}]";
        propertyShape = "[{\"@id\":\"http://mobi.com/ontologies/namespace#watchesRecordPropertyShape\",\"@type\":" +
                "[\"http://www.w3.org/ns/shacl#PropertyShape\"],\"http://www.w3.org/ns/shacl#class\":" +
                "[{\"@id\":\"http://mobi.com/ontologies/catalog#VersionedRDFRecord\"}],\"http://www.w3.org/ns/shacl#maxCount\":" +
                "[{\"@type\":\"http://www.w3.org/2001/XMLSchema#integer\",\"@value\":\"1\"}],\"http://www.w3.org/ns/shacl#minCount\":" +
                "[{\"@type\":\"http://www.w3.org/2001/XMLSchema#integer\",\"@value\":\"1\"}],\"http://www.w3.org/ns/shacl#nodeKind\":" +
                "[{\"@id\":\"http://www.w3.org/ns/shacl#IRI\"}],\"http://www.w3.org/ns/shacl#path\":[{\"@id\":" +
                "\"http://mobi.com/ontologies/namespace#watchesRecord\"}],\"https://mobi.solutions/ontologies/form#usesFormField\":" +
                "[{\"@id\":\"https://mobi.solutions/ontologies/form#AutocompleteInput\"}]}]";
        focusNode = "[{\"http://mobi.com/ontologies/namespace#watchesRecord\":" +
                "[{\"@id\":\"https://mobi.com/records#7962730d-637a-4184-99ec-4a840e77aa86\"}]," +
                "\"http://mobi.com/ontologies/namespace#watchesBranch\":[{\"@id\":\"\"}],\"@id\":" +
                "\"https://mobi.solutions/ontologies/form#73890ba8-2ba4-47b2-85a6-ff8fb3c999ef\",\"@type\":" +
                "[\"http://mobi.com/ontologies/namespace#CommitToBranchTriggerApplicationSetting\"]}]";

        when(mock(OsgiRepository.class).getConnection()).thenReturn(mockConnection);
        doNothing().when(mockConnection).begin();
        TupleQuery mockQuery = mock(TupleQuery.class);
        when(mockConnection.prepareTupleQuery(anyString())).thenReturn(mockQuery);
        TupleQueryResult mockResult = mock(TupleQueryResult.class);
        when(mockQuery.evaluate()).thenReturn(mockResult);
        BindingSet bindingSet1 = mock(BindingSet.class);
        BindingSet bindingSet2 = mock(BindingSet.class);
        Binding nameBinding1 = mock(Binding.class);
        Binding iriBinding1 = mock(Binding.class);
        String iri1 = "http://example.org/entity1";
        String iri2 = "http://example.org/entity2";
        when(iriBinding1.getValue()).thenReturn(vf.createIRI(iri1));
        when(nameBinding1.getValue()).thenReturn(vf.createIRI(iri2));
        when(pdp.createRequest(any(List.class), any(Map.class), any(List.class), any(Map.class), any(List.class), any(Map.class))).thenReturn(request);
        when(pdp.filter(eq(request), any(IRI.class))).thenReturn(Sets.newSet(iri1, iri2));
        when(user.getResource()).thenReturn(vf.createIRI("urn:testUser"));
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        Binding nameBinding2 = mock(Binding.class);
        Binding iriBinding2 = mock(Binding.class);
        when(iriBinding2.getValue()).thenReturn(vf.createIRI("http://example.org/entity2"));
        when(nameBinding2.getValue()).thenReturn(vf.createLiteral("Entity 2"));
        when(bindingSet1.getBinding("value")).thenReturn(iriBinding1);
        when(bindingSet1.getBinding("name")).thenReturn(nameBinding1);
        when(bindingSet2.getBinding("value")).thenReturn(iriBinding2);
        when(bindingSet2.getBinding("name")).thenReturn(nameBinding2);
        when(mockResult.hasNext()).thenReturn(true, true, false);
        when(mockResult.next()).thenReturn(bindingSet1, bindingSet2);
    }

    @Test
    public void retrieveAutoCompleteOptions_MissingPropertyShape() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("focusNode", focusNode);
        Response response = target().path("web-forms/options").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }
//
    @Test
    public void retrieveAutoCompleteOptions_ValidPropertyShapeWithSparql_NoFocusNode() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("propertyShape", propertyShapeWithSparql);
        Response response = target().path("web-forms/options").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void retrieveAutoCompleteOptions_ValidPropertyShapeWithoutSparql_NoFocusNode() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("propertyShape", propertyShape);
        Response response = target().path("web-forms/options").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void retrieveAutoCompleteOptions_ValidRequest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("propertyShape", propertyShapeWithSparql);
        fd.field("focusNode", focusNode);
        Response response = target().path("web-forms/options").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
    }
}
