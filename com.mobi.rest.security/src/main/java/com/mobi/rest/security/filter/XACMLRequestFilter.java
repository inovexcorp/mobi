package com.mobi.rest.security.filter;

/*-
 * #%L
 * com.mobi.rest.security
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import com.mobi.exception.MobiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.wso2.balana.utils.Constants.PolicyConstants;
import org.wso2.balana.utils.PolicyUtils;
import org.wso2.balana.utils.Utils;
import org.wso2.balana.utils.exception.PolicyBuilderException;
import org.wso2.balana.utils.policy.dto.AttributeElementDTO;
import org.wso2.balana.utils.policy.dto.AttributeValueElementDTO;
import org.wso2.balana.utils.policy.dto.RequestElementDTO;

import java.io.IOException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.ext.Provider;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;

@Provider
@Component(immediate = true)
public class XACMLRequestFilter implements ContainerRequestFilter {

    private final Logger log = LoggerFactory.getLogger(XACMLRequestFilter.class);

    @Override
    public void filter(ContainerRequestContext containerRequestContext) throws IOException {
        Document doc = null;
        try {
            doc = Utils.createNewDocument();
        } catch (ParserConfigurationException e) {
            throw new MobiException(new PolicyBuilderException("While creating Document Object", e));
        }

        RequestElementDTO requestElementDTO = new RequestElementDTO();

        AttributeValueElementDTO attributeValueElementDTO = new AttributeValueElementDTO();
        attributeValueElementDTO.setAttributeDataType(PolicyConstants.STRING_DATA_TYPE);
        attributeValueElementDTO.setAttributeValue(containerRequestContext.get);


        AttributeElementDTO attributeElementDTO = new AttributeElementDTO();
        attributeElementDTO.


        requestElementDTO.at

        try {
            doc.appendChild(PolicyUtils.createRequestElement(requestElementDTO, doc));
        } catch (PolicyBuilderException e) {
            e.printStackTrace();
        }
        try {
            log.error("XACML DOC:\n" + Utils.getStringFromDocument(doc));
        } catch (TransformerException e) {
            e.printStackTrace();
        }
    }
}
