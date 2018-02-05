package com.mobi.security.policy.impl.balana;

/*-
 * #%L
 * com.mobi.security.policy.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.security.policy.api.PIP;
import com.mobi.security.policy.impl.XACML;
import com.mobi.vocabularies.xsd.XSD;
import org.w3c.dom.Document;
import org.wso2.balana.attr.AttributeValue;
import org.wso2.balana.attr.BagAttribute;
import org.wso2.balana.attr.StringAttribute;
import org.wso2.balana.cond.EvaluationResult;
import org.wso2.balana.ctx.EvaluationCtx;
import org.wso2.balana.ctx.Status;
import org.wso2.balana.finder.AttributeFinderModule;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class BalanaPIP extends AttributeFinderModule implements PIP {

    private Repository repo;
    private ValueFactory vf;

    private Map<String, String> categoryIds = new HashMap<>();

    @Activate
    public void setUp() {
        categoryIds.put(XACML.SUBJECT_CATEGORY, XACML.SUBJECT_ID);
        categoryIds.put(XACML.RESOURCE_CATEGORY, XACML.RESOURCE_ID);
    }

    @Reference
    void setRepo(Repository repo) {
        this.repo = repo;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public boolean isDesignatorSupported() {
        return true;
    }

    @Override
    public Set<String> getSupportedCategories() {
        return categoryIds.keySet();
    }

    @Override
    public Set<com.mobi.security.policy.api.AttributeValue> findAttribute(IRI attributeId, IRI attributeType,
                                                                          IRI categoryIRI, String issuer,
                                                                          Document request) {
        return null;
    }

    @Override
    public EvaluationResult findAttribute(URI attributeType, URI attributeId, String issuer, URI category,
                                          EvaluationCtx context) {
        if (!categoryIds.containsKey(category.toString())) {
            // TODO: Return null result
            return new EvaluationResult(new Status(Collections.singletonList(Status.STATUS_PROCESSING_ERROR)));
        }
        EvaluationResult idResult = context.getAttribute(getURI(XSD.STRING),
                getURI(categoryIds.get(category.toString())), issuer, category);
        if (idResult == null || idResult.getAttributeValue() == null || !idResult.getAttributeValue().isBag()) {
            // TODO: Return null result
            return new EvaluationResult(new Status(Collections.singletonList(Status.STATUS_PROCESSING_ERROR)));
        }

        BagAttribute bagAttribute = (BagAttribute) idResult.getAttributeValue();
        Resource id = vf.createIRI(((AttributeValue) bagAttribute.iterator().next()).encode());
        IRI prop = vf.createIRI(attributeId.toString());

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(id, prop, null));
            List<AttributeValue> attributeValues = new ArrayList<>();
            if (statements.size() == 0) {
                // TODO: Return null result
                return new EvaluationResult(new Status(Collections.singletonList(Status.STATUS_PROCESSING_ERROR)));
            } else if (statements.size() == 1) {
                Statement statement = statements.get(0);
                Value value = statement.getObject();
                attributeValues.add(new StringAttribute(value.stringValue()));
            } else {
                statements.stream()
                        .map(Statement::getObject)
                        .map(Value::stringValue)
                        .map(StringAttribute::new)
                        .forEach(attributeValues::add);
            }
            return new EvaluationResult(new BagAttribute(attributeType, attributeValues));
        }
    }

    private URI getURI(String uri) {
        try {
            return new URI(uri);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Not a valid URI", e);
        }
    }
}
