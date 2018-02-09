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
import com.mobi.security.policy.pip.impl.MobiPIP;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class BalanaPIP extends AttributeFinderModule {

    private ValueFactory vf;
    private MobiPIP pip;

    private Map<String, String> categoryIds = new HashMap<>();

    public BalanaPIP(ValueFactory vf, MobiPIP mobiPIP) {
        this.vf = vf;
        this.pip = mobiPIP;
        categoryIds.put(XACML.SUBJECT_CATEGORY, XACML.SUBJECT_ID);
        categoryIds.put(XACML.RESOURCE_CATEGORY, XACML.RESOURCE_ID);
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
    public EvaluationResult findAttribute(URI attributeType, URI attributeId, String issuer, URI category,
                                          EvaluationCtx context) {
        if (!categoryIds.containsKey(category.toString())) {
            return new EvaluationResult(new Status(Collections.singletonList(Status.STATUS_PROCESSING_ERROR),
                    "Unsupported category"));
        }

        BasicAttributeDesignator designator = new BasicAttributeDesignator(vf.createIRI(attributeId.toString()),
                vf.createIRI(category.toString()), vf.createIRI(attributeType.toString()));
        List<Literal> values = pip.findAttribute(designator, new XACMLRequest(context.getRequestCtx(), vf));
        List<AttributeValue> attributeValues = new ArrayList<>();
        if (values.size() == 0) {
            return new EvaluationResult(new Status(Collections.singletonList(Status.STATUS_MISSING_ATTRIBUTE)));
        } else if (values.size() == 1) {
            attributeValues.add(getAttributeValue(values.get(0)));
        } else {
            values.stream()
                    .map(this::getAttributeValue)
                    .forEach(attributeValues::add);
        }
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
