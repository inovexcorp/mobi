package org.matonto.catalog.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.catalog.rest.CatalogRest;
import org.matonto.catalog.rest.jaxb.DistributionMarshaller;
import org.matonto.catalog.rest.jaxb.PaginatedResults;
import org.matonto.catalog.rest.jaxb.PublishedResourceMarshaller;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.Response;
import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;
import java.time.OffsetDateTime;
import java.util.*;

@Component(immediate = true)
public class CatalogRestImpl implements CatalogRest {

    private CatalogManager catalogManager;
    private ValueFactory valueFactory;

    private static final Set<String> RESOURCE_TYPES;

    static {
        Set<String> types = new HashSet<>();
        types.add("http://matonto.org/ontologies/catalog#PublishedResource");
        types.add("http://matonto.org/ontologies/catalog#Ontology");
        RESOURCE_TYPES = Collections.unmodifiableSet(types);
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Override
    public PublishedResourceMarshaller getPublishedResource(String resourceId) {
        if (resourceId == null) {
            throw ErrorUtils.sendError("Must provide a resource ID.", Response.Status.BAD_REQUEST);
        }

        Optional<PublishedResource> publishedResourceOptional = checkForResource(resourceId);

        if (publishedResourceOptional.isPresent()) {
            return processResource(publishedResourceOptional.get());
        } else {
            return null;
        }
    }

    @Override
    public Response createPublishedResource(PublishedResourceMarshaller resource, String resourceType) {
        return null;
    }

    @Override
    public Response deletePublishedResource(String resourceId) {
        return null;
    }

    @Override
    public PaginatedResults<PublishedResourceMarshaller> listPublishedResources(String resourceType,
                                                                                String searchTerms, int limit,
                                                                                int start) {
        List<PublishedResourceMarshaller> publishedResources = new ArrayList<>();

        catalogManager.findResource(searchTerms, limit, start).forEach(resource ->
                publishedResources.add(processResource(resource)));

        PaginatedResults<PublishedResourceMarshaller> marshaller = new PaginatedResults<>();
        marshaller.setResults(publishedResources);
        marshaller.setLimit(limit);
        marshaller.setSize(publishedResources.size());
        marshaller.setStart(start);

        return marshaller;
    }

    @Override
    public PaginatedResults<DistributionMarshaller> getDistributions(String resourceId, int limit, int start) {
        return null;
    }

    @Override
    public Response createDistribution(Distribution distribution, String resourceId) {
        return null;
    }

    @Override
    public Response deleteDistributions(String resourceId) {
        return null;
    }

    @Override
    public DistributionMarshaller getDistribution(String resourceId, String distributionId) {
        if (resourceId == null || distributionId == null) {
            throw ErrorUtils.sendError("Must provide a resource ID and a distribution ID.",
                    Response.Status.BAD_REQUEST);
        }

        Optional<PublishedResource> publishedResourceOptional = checkForResource(resourceId);

        if (publishedResourceOptional.isPresent()) {
            PublishedResource publishedResource = publishedResourceOptional.get();

            Optional<Distribution> distributionOptional = checkForDistribution(publishedResource, distributionId);

            if (distributionOptional.isPresent()) {
                Distribution distribution = distributionOptional.get();

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

        return null;
    }

    @Override
    public Response deleteDistribution(String resourceId, String distributionId) {
        return null;
    }

    @Override
    public Response getResourceTypes() {
        JSONArray json = new JSONArray();

        RESOURCE_TYPES.forEach(json::add);

        return Response.ok(json.toString()).build();
    }

    private boolean isBNodeString(String string) {
        return string.matches("^_:.*$");
    }

    private XMLGregorianCalendar getCalendar(OffsetDateTime offsetDateTime) {
        GregorianCalendar calendar = GregorianCalendar.from(offsetDateTime.toZonedDateTime());

        try {
            return DatatypeFactory.newInstance().newXMLGregorianCalendar(calendar);
        } catch (DatatypeConfigurationException e) {
            throw ErrorUtils.sendError(e, "Unable to serialize resource data", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Optional<PublishedResource> checkForResource(String resourceId) {
        Resource resource =
                isBNodeString(resourceId) ? valueFactory.createBNode(resourceId) : valueFactory.createIRI(resourceId);

        return catalogManager.getResource(resource);
    }

    private Optional<Distribution> checkForDistribution(PublishedResource resource, String distributionId) {
        Resource distributionResource =
                isBNodeString(distributionId) ? valueFactory.createBNode(distributionId) : valueFactory.createIRI(distributionId);

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

        Set<String> keywords = new HashSet<>();
        resource.getKeywords().forEach(keywords::add);
        marshaller.setKeywords(keywords);

        Set<String> distributions = new HashSet<>();
        resource.getDistributions().forEach(distribution ->
                distributions.add(distribution.getResource().stringValue()));
        marshaller.setDistributions(distributions);

        return marshaller;
    }
}
