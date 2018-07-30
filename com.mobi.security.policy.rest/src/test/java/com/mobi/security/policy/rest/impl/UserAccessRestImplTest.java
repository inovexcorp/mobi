package com.mobi.security.policy.rest.impl;

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Before;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;
import javax.ws.rs.core.Application;

public class UserAccessRestImplTest extends MobiRestTestNg {
    private UserAccessRestImpl rest;
    private ValueFactory vf;
    private JSONObject json;
    private String policyXml;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);
        vf = getValueFactory();

        rest = new UserAccessRestImpl();
        policyXml = IOUtils.toString(getClass().getResourceAsStream("/policy.xml"), "UTF-8");


        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @Before
    public void setUpMocks() throws Exception {
        Map<String, Literal> subjectAttrs = new HashMap<>();
        IRI resourceId = vf.createIRI("urn:resourceId");
        Map<String, Literal> resourceAttrs = new HashMap<>();
        IRI actionId = vf.createIRI("urn:actionId");
        Map<String, Literal> actionAttrs = new HashMap<>();

        json = new JSONObject();
        json.put("subjectAttrs", subjectAttrs);
        json.put("resourceId", resourceId);
        json.put("resourceAttrs", resourceAttrs);
        json.put("actionId", actionId);
        json.put("actionAttrs", actionAttrs);
    }
}
