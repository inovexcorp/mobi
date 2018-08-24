package com.mobi.security.policy.impl.xacml;

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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.BasicAttributeDesignator;
import com.mobi.security.policy.api.PIP;
import com.mobi.security.policy.api.xacml.XACML;
import org.wso2.balana.ProcessingException;
import org.wso2.balana.attr.AnyURIAttribute;
import org.wso2.balana.attr.AttributeValue;
import org.wso2.balana.attr.BagAttribute;
import org.wso2.balana.attr.BooleanAttribute;
import org.wso2.balana.attr.DateTimeAttribute;
import org.wso2.balana.attr.DoubleAttribute;
import org.wso2.balana.attr.IntegerAttribute;
import org.wso2.balana.attr.StringAttribute;
import org.wso2.balana.cond.EvaluationResult;
import org.wso2.balana.ctx.EvaluationCtx;
import org.wso2.balana.ctx.Status;
import org.wso2.balana.finder.AttributeFinderModule;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.xml.bind.JAXBContext;

public class MobiAttributeFinder extends AttributeFinderModule {

    private ValueFactory vf;
    private PIP pip;
    protected JAXBContext jaxbContext;

    private Set<String> categoryIds = new HashSet<>();

    public MobiAttributeFinder(ValueFactory vf, PIP pip, JAXBContext jaxbContext) {
        this.vf = vf;
        this.pip = pip;
        this.jaxbContext = jaxbContext;
        categoryIds.add(XACML.SUBJECT_CATEGORY);
        categoryIds.add(XACML.RESOURCE_CATEGORY);
        categoryIds.add(XACML.ACTION_CATEGORY);
        categoryIds.add(XACML.ENVIRONMENT_CATEGORY);
    }

    @Override
    public boolean isDesignatorSupported() {
        return true;
    }

    @Override
    public Set<String> getSupportedCategories() {
        return categoryIds;
    }

    @Override
    public EvaluationResult findAttribute(URI attributeType, URI attributeId, String issuer, URI category,
                                          EvaluationCtx context) {
        if (!categoryIds.contains(category.toString())) {
            return new EvaluationResult(new Status(Collections.singletonList(Status.STATUS_PROCESSING_ERROR),
                    "Unsupported category"));
        }

        BasicAttributeDesignator designator = new BasicAttributeDesignator(vf.createIRI(attributeId.toString()),
                vf.createIRI(category.toString()), vf.createIRI(attributeType.toString()));
        List<Literal> values = pip.findAttribute(designator, new BalanaRequest(context.getRequestCtx(), vf, jaxbContext));
        List<AttributeValue> attributeValues = new ArrayList<>();
        values.stream()
                .map(this::getAttributeValue)
                .forEach(attributeValues::add);

        return new EvaluationResult(new BagAttribute(attributeType, attributeValues));
    }

    private AttributeValue getAttributeValue(Literal literal) {
        IRI datatype = literal.getDatatype();
        switch (datatype.stringValue()) {
            case "http://www.w3.org/2001/XMLSchema#string":
                return new StringAttribute(literal.stringValue());
            case "http://www.w3.org/2001/XMLSchema#boolean":
                return BooleanAttribute.getInstance(literal.booleanValue());
            case "http://www.w3.org/2001/XMLSchema#double":
                return new DoubleAttribute(literal.doubleValue());
            case "http://www.w3.org/2001/XMLSchema#integer":
                return new IntegerAttribute(literal.longValue());
            case "http://www.w3.org/2001/XMLSchema#anyURI":
                try {
                    return new AnyURIAttribute(new URI(literal.stringValue()));
                } catch (URISyntaxException e) {
                    throw new ProcessingException("Not a valid URI");
                }
            case "https://www.w3.org/2001/XMLSchema#dateTime":
                return new DateTimeAttribute(new Date(literal.dateTimeValue().toInstant().toEpochMilli()));
            default:
                throw new ProcessingException("Datatype " + datatype + " is not supported");
        }
    }
}
