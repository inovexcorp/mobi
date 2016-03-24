package org.matonto.catalog.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Ontology;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Bindings;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.Binding;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.Resource;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Set;

@Component
public class SimpleCatalogManager implements CatalogManager {

    private Repository repo;

    @Reference(target = "(id=system)")
    protected void setRepo(Repository repo) {
        this.repo = repo;
    }

    private static final String GET_RESOURCE_QUERY;
    private static final String RESOURCE_BINDING = "resource";

    static {
        try {
            GET_RESOURCE_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-resource.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public <T extends PublishedResource> Set<T> findResource(String searchTerm) {
        return null;
    }

    @Override
    public Optional<PublishedResource> getResource(Resource resource) {
        RepositoryConnection conn = repo.getConnection();

        TupleQuery query = conn.prepareTupleQuery(GET_RESOURCE_QUERY);
        query.setBinding(RESOURCE_BINDING, resource);

        TupleQueryResult result = query.evaluate();

        // TODO: See if we can use the Model API
        if (result.hasNext()) {
            BindingSet bindingSet = result.next();

            // Get Required Params
            String title = Bindings.requiredLiteral(bindingSet, "title").stringValue();
            Resource type = Bindings.requiredResource(bindingSet, "type");

            SimplePublishedResource.Builder builder = new SimplePublishedResource.Builder(resource, type, title);
            builder.issued(Bindings.requiredLiteral(bindingSet, "issued").dateTimeValue());
            builder.modified(Bindings.requiredLiteral(bindingSet, "modified").dateTimeValue());

            bindingSet.getBinding("description").ifPresent(binding ->
                    builder.description(binding.getValue().stringValue()));

            bindingSet.getBinding("identifier").ifPresent(binding ->
                    builder.identifier(binding.getValue().stringValue()));

            bindingSet.getBinding("keyword").ifPresent(binding -> {
                String[] keywords = StringUtils.split(binding.getValue().stringValue(), ",");

                for (String keyword : keywords) {
                    builder.addKeyword(keyword);
                }
            });

            result.close();
            conn.close();
            return Optional.of(builder.build());
        } else {
            result.close();
            conn.close();
            return Optional.empty();
        }
    }

//    @Override
//    public <T extends PublishedResource> Optional<T> getResource(Resource resource, Class<T> clazz) {
//        RepositoryConnection conn = repo.getConnection();
//
//        TupleQuery query = conn.prepareTupleQuery(GET_RESOURCE_QUERY);
//        query.setBinding(RESOURCE_BINDING, resource);
//
//        TupleQueryResult result = query.evaluate();
//
//        // TODO: See if we can use the Model API
//        if (result.hasNext()) {
//            BindingSet bindingSet = result.next();
//
//            String title = bindingSet.getBinding("title").get().getValue().stringValue();
//
//            SimpleOntology.Builder builder = new SimpleOntology.Builder(title);
//            builder.issued(OffsetDateTime.parse(bindingSet.getBinding("issued").get().getValue().stringValue()));
//            builder.modified(OffsetDateTime.parse(bindingSet.getBinding("modified").get().getValue().stringValue()));
//
//            if (bindingSet.hasBinding("description")) {
//                builder.description(bindingSet.getBinding("description").get().getValue().stringValue());
//            }
//
//            if (bindingSet.hasBinding("identifier")) {
//                builder.identifier(bindingSet.getBinding("identifier").get().getValue().stringValue());
//            }
//
//            if (bindingSet.hasBinding("keyword")) {
//                String[] keywords =
//                        StringUtils.split(bindingSet.getBinding("keyword").get().getValue().stringValue(), ",");
//
//                for (String keyword : keywords) {
//                    builder.addKeyword(keyword);
//                }
//            }
//
//            result.close();
//            conn.close();
//            return null;
//        } else {
//            result.close();
//            conn.close();
//            return Optional.empty();
//        }
//    }

    @Override
    public <T extends PublishedResource> T removeResource(Resource resource) {
        return null;
    }

    @Override
    public void createOntology(org.matonto.ontology.core.api.Ontology ontology) {
        return;
    }
}
