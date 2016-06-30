package org.matonto.catalog.rest.impl;

/*-
 * #%L
 * org.matonto.catalog.rest
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
import net.sf.json.JSONArray;
import org.apache.log4j.Logger;
import org.matonto.catalog.api.*;
import org.matonto.catalog.rest.CatalogRest;
import org.matonto.catalog.rest.jaxb.DistributionMarshaller;
import org.matonto.catalog.rest.jaxb.PublishedResourceMarshaller;
import org.matonto.persistence.utils.Values;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.rest.util.LinksUtils;
import org.matonto.rest.util.jaxb.PaginatedResults;

import java.time.OffsetDateTime;
import java.util.*;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;

@Component(immediate = true)
public class CatalogRestImpl implements CatalogRest {

    private CatalogManager catalogManager;
    private Values values;
    private ValueFactory valueFactory;
    private CatalogFactory catalogFactory;

    private static final Set<String> RESOURCE_TYPES;
    private static final Set<String> SORT_RESOURCES;

    private static final String DC = "http://purl.org/dc/terms/";

    private final Logger log = Logger.getLogger(CatalogRestImpl.class);

    static {
        Set<String> types = new HashSet<>();
        types.add("http://matonto.org/ontologies/catalog#PublishedResource");
        types.add("http://matonto.org/ontologies/catalog#Ontology");
        types.add("http://matonto.org/ontologies/catalog#Mapping");
        RESOURCE_TYPES = Collections.unmodifiableSet(types);

        Set<String> sortResources = new HashSet<>();
        sortResources.add(DC + "modified");
        sortResources.add(DC + "issued");
        sortResources.add(DC + "title");
        SORT_RESOURCES = Collections.unmodifiableSet(sortResources);
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setValues(Values values) {
        this.values = values;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    protected void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Override
    public PublishedResourceMarshaller getPublishedResource(String resourceId) {
        if (resourceId == null) {
            throw ErrorUtils.sendError("Must provide a resource ID.", Response.Status.BAD_REQUEST);
        }

        Optional<PublishedResource> publishedResourceOptional =
                catalogManager.getResource(values.getIriOrBnode(resourceId));

        if (publishedResourceOptional.isPresent()) {
            return processResource(publishedResourceOptional.get());
        } else {
            return null;
        }
    }

    @Override
    public Response createPublishedResource(PublishedResourceMarshaller resource, String resourceType) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deletePublishedResource(String resourceId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public PaginatedResults<PublishedResourceMarshaller> listPublishedResources(UriInfo uriInfo, String resourceType,
                                                                                String searchTerms, String sortBy,
                                                                                boolean asc, int limit, int start) {
        IRI sortResource = valueFactory.createIRI(sortBy);

        PaginatedSearchParamsBuilder builder = catalogFactory.createSearchParamsBuilder(limit, start, sortResource)
                .ascending(asc);

        if (resourceType != null) {
            builder.typeFilter(valueFactory.createIRI(resourceType));
        }

        PaginatedSearchParams searchParams = builder.build();

        PaginatedSearchResults<PublishedResource> searchResults = catalogManager.findResource(searchParams);

        List<PublishedResourceMarshaller> publishedResources = new ArrayList<>();
        searchResults.getPage().forEach(resource -> publishedResources.add(processResource(resource)));

        int size = searchResults.getPage().size();

        PaginatedResults<PublishedResourceMarshaller> marshaller = new PaginatedResults<>();
        marshaller.setResults(publishedResources);
        marshaller.setLimit(limit);
        marshaller.setSize(size);
        marshaller.setStart(start);
        marshaller.setTotalSize(searchResults.getTotalSize());

        marshaller.setLinks(LinksUtils.buildLinks(uriInfo, size, searchResults.getTotalSize(), limit, start));

        return marshaller;
    }

    @Override
    public Set<DistributionMarshaller> getDistributions(String resourceId) {
        if (resourceId == null) {
            throw ErrorUtils.sendError("Must provide a resource ID.", Response.Status.BAD_REQUEST);
        }

        Optional<PublishedResource> publishedResourceOptional =
                catalogManager.getResource(values.getIriOrBnode(resourceId));

        if (publishedResourceOptional.isPresent()) {
            PublishedResource publishedResource = publishedResourceOptional.get();

            Set<DistributionMarshaller> distributions = new HashSet<>();
            publishedResource.getDistributions().forEach(distribution ->
                    distributions.add(processDistribution(distribution)));

            return distributions;
        } else {
            return null;
        }
    }

    @Override
    public Response createDistribution(Distribution distribution, String resourceId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteDistributions(String resourceId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public DistributionMarshaller getDistribution(String resourceId, String distributionId) {
        if (resourceId == null || distributionId == null) {
            throw ErrorUtils.sendError("Must provide a resource ID and a distribution ID.",
                    Response.Status.BAD_REQUEST);
        }

        Optional<PublishedResource> publishedResourceOptional =
                catalogManager.getResource(values.getIriOrBnode(resourceId));

        // If resource and distribution are present, return distribution
        if (publishedResourceOptional.isPresent()) {
            PublishedResource publishedResource = publishedResourceOptional.get();

            Optional<Distribution> distributionOptional = checkForDistribution(publishedResource, distributionId);

            if (distributionOptional.isPresent()) {
                return processDistribution(distributionOptional.get());
            }
        }

        return null;
    }

    @Override
    public Response deleteDistribution(String resourceId, String distributionId) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response getResourceTypes() {
        JSONArray json = new JSONArray();

        RESOURCE_TYPES.forEach(json::add);

        return Response.ok(json.toString()).build();
    }

    @Override
    public Response getSortOptions() {
        JSONArray json = new JSONArray();

        SORT_RESOURCES.forEach(json::add);

        return Response.ok(json.toString()).build();
    }

    private XMLGregorianCalendar getCalendar(OffsetDateTime offsetDateTime) {
        GregorianCalendar calendar = GregorianCalendar.from(offsetDateTime.toZonedDateTime());

        try {
            return DatatypeFactory.newInstance().newXMLGregorianCalendar(calendar);
        } catch (DatatypeConfigurationException e) {
            throw ErrorUtils.sendError(e, "Unable to serialize resource data", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Optional<Distribution> checkForDistribution(PublishedResource resource, String distributionId) {
        Resource distributionResource = values.getIriOrBnode(distributionId);

        for (Distribution distribution : resource.getDistributions()) {
            if (distribution.getResource().equals(distributionResource)) {
                return Optional.of(distribution);
            }
        }

        return Optional.empty();
    }

    private PublishedResourceMarshaller processResource(PublishedResource resource) {
        PublishedResourceMarshaller marshaller = new PublishedResourceMarshaller();
        marshaller.setId(resource.getResource().stringValue());
        marshaller.setTitle(resource.getTitle());
        marshaller.setDescription(resource.getDescription());
        marshaller.setIssued(getCalendar(resource.getIssued()));
        marshaller.setModified(getCalendar(resource.getModified()));
        marshaller.setIdentifier(resource.getIdentifier());

        Set<String> types = new HashSet<>();
        resource.getTypes().forEach(res -> types.add(res.stringValue()));
        marshaller.setTypes(types);

        marshaller.setKeywords(resource.getKeywords());

        Set<String> distributions = new HashSet<>();
        resource.getDistributions().forEach(distribution ->
                distributions.add(distribution.getResource().stringValue()));
        marshaller.setDistributions(distributions);

        return marshaller;
    }

    private DistributionMarshaller processDistribution(Distribution distribution) {
        DistributionMarshaller marshaller = new DistributionMarshaller();
        marshaller.setId(distribution.getResource().stringValue());
        marshaller.setTitle(distribution.getTitle());
        marshaller.setDescription(distribution.getDescription());
        marshaller.setIssued(getCalendar(distribution.getIssued()));
        marshaller.setModified(getCalendar(distribution.getModified()));
        marshaller.setLicense(distribution.getLicense());
        marshaller.setRights(distribution.getRights());

        String accessURL = distribution.getAccessURL() == null ? null : distribution.getAccessURL().toString();
        marshaller.setAccessURL(accessURL);

        String downloadURL = distribution.getDownloadURL() == null ? null : distribution.getDownloadURL().toString();
        marshaller.setDownloadURL(downloadURL);

        marshaller.setMediaType(distribution.getMediaType());
        marshaller.setFormat(distribution.getFormat());
        marshaller.setBytesSize(distribution.getByteSize());

        return marshaller;
    }
}
