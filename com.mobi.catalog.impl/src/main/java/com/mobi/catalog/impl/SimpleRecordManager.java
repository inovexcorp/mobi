package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.builder.KeywordCount;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.EntityMetadata;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.util.SearchResults;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.Statements;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.xacml.XACML;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.explanation.Explanation;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class SimpleRecordManager implements RecordManager {

    private static final Logger log = LoggerFactory.getLogger(SimpleRecordManager.class);
    private static final String FIND_RECORDS_QUERY;
    private static final String COUNT_RECORDS_QUERY;
    private static final String GET_ENTITIES_QUERY;
    private static final String GET_ENTITIES_COUNT_QUERY;
    private static final String GET_KEYWORD_QUERY;
    private static final String GET_KEYWORD_COUNT_QUERY;
    private static final String RECORD_BINDING = "record";
    private static final String CATALOG_BINDING = "catalog";
    private static final String KEYWORD_BINDING = "keyword";
    private static final String RECORD_COUNT_BINDING = "record_count";
    private static final String KEYWORD_COUNT_BINDING = "keyword_count";
    private static final String TYPE_FILTER_BINDING = "type_filter";
    private static final String SEARCH_BINDING = "search_text";

    private static final String RECORD_TYPE_BINDING = "recordType";
    private static final String ENTITY_IRI_BINDING = "entityIri";
    private static final String ENTITY_NAME_BINDING = "entityName";
    private static final String DESCRIPTION_BINDING = "description";
    private static final String ENTITY_TYPES_BINDING = "entityTypes";
    public static final String SEPARATOR_DELIMITER = "�";
    public static final String PAIR_SEPARATOR_DELIMITER = "��";

    static {
        try {
            FIND_RECORDS_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogManager.class.getResourceAsStream("/record/find-records.rq")),
                    StandardCharsets.UTF_8
            );
            COUNT_RECORDS_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogManager.class.getResourceAsStream("/record/count-records.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ENTITIES_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogManager.class.getResourceAsStream("/record/find-entities.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ENTITIES_COUNT_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogManager.class.getResourceAsStream("/record/find-entities-count.rq")),
                    StandardCharsets.UTF_8
            );
            GET_KEYWORD_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogManager.class.getResourceAsStream("/record/get-keywords.rq")),
                    StandardCharsets.UTF_8
            );
            GET_KEYWORD_COUNT_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleCatalogManager.class.getResourceAsStream("/record/get-keywords-count.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private final ValueFactory vf = new ValidatingValueFactory();
    private final Map<Resource, String> sortingOptions = new HashMap<>();
    /**
     * A map of the available RecordServices. The string is get typeIRI for the individual RecordService.
     */
    private final Map<Class, RecordService> recordServices = new HashMap<>();

    @Reference
    protected ThingManager thingManager;

    @Reference
    protected PDP pdp;

    @Reference
    protected RecordFactory recordFactory;

    @Reference
    protected OrmFactoryRegistry factoryRegistry;

    @Reference
    protected CatalogFactory catalogFactory;

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    protected void addRecordService(RecordService<? extends Record> recordService) {
        recordServices.put(recordService.getType(), recordService);
    }

    @Activate
    protected void start() {
        createSortingOptions();
    }

    @Modified
    protected void modified() {
        start();
    }

    @Override
    public <T extends Record> T createRecord(User user, RecordOperationConfig config, Class<T> recordClass,
                                             RepositoryConnection conn) {
        RecordService<T> recordService = Optional.ofNullable(getRecordService(recordClass))
                .orElseThrow(() -> new IllegalArgumentException("Service for factory " + recordClass.toString()
                        + " is unavailable or doesn't exist."));
        return recordService.create(user, config, conn);
    }

    @Override
    public void export(Resource recordIRI, RecordOperationConfig config, RepositoryConnection conn) {
        OrmFactory<? extends Record> factory = getFactory(recordIRI, conn, false);
        RecordService<? extends Record> service = getRecordService(factory.getType());
        service.export(recordIRI, config, conn);
    }

    @Override
    public void export(List<Resource> recordIRIs, RecordOperationConfig config, RepositoryConnection conn) {
        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        boolean exporterIsActive = exporter.isActive();
        if (!exporterIsActive) {
            exporter.startRDF();
        }
        recordIRIs.forEach(iri -> export(iri, config, conn));
        if (!exporterIsActive) {
            exporter.endRDF();
        }
    }

    @Override
    public PaginatedSearchResults<EntityMetadata> findEntities(Resource catalogId,
                                                               PaginatedSearchParams searchParams,
                                                               User user,
                                                               RepositoryConnection conn) {
        // Filters down to VersionedRDFRecords that the requesting user can read before searching for entities
        PaginatedSearchParams searchRecords = new PaginatedSearchParams.Builder()
                .typeFilter(vf.createIRI(VersionedRDFRecord.TYPE))
                .build();
        List<String> viewableRecords = getViewableRecords(catalogId, searchRecords, user, conn);

        if (viewableRecords.isEmpty()) {
            return SearchResults.emptyResults();
        }
        Optional<String> searchTextParam = searchParams.getSearchText();
        String viewableRecordsConcat  = viewableRecords.stream()
                .map(record -> String.format("<%s>", record))
                .collect(Collectors.joining(" "));
        // Count Query
        String countQueryStr =  GET_ENTITIES_COUNT_QUERY
                .replace("%RECORDS%", viewableRecordsConcat);
        if (log.isTraceEnabled()) {
            log.trace("Count Query: " + countQueryStr);
        }
        TupleQuery countQuery = conn.prepareTupleQuery(countQueryStr);
        searchTextParam.ifPresent((searchText) -> countQuery.setBinding(SEARCH_BINDING,
                conn.getValueFactory().createLiteral(searchText)));
        int totalCount = 0;
        try(TupleQueryResult countResults = countQuery.evaluate()) {
            if (countResults.getBindingNames().contains("count") && countResults.hasNext()) {
                totalCount = Bindings.requiredLiteral(countResults.next(), "count").intValue();
            }
            if (log.isTraceEnabled()) {
                log.trace("Count Query Timings: " + countQuery.explain(Explanation.Level.Timed).toString());
            }
        }
        if (totalCount == 0) {
            return SearchResults.emptyResults();
        }
        int offset = searchParams.getOffset();
        int limit = searchParams.getLimit().orElse(totalCount);

        if (offset > totalCount) {
            throw new IllegalArgumentException("Offset exceeds total size");
        }
        // Get Entities query
        String entitiesQueryStr = GET_ENTITIES_QUERY
                .replace("%RECORDS%", viewableRecordsConcat)
                .replace("#%LIMIT%", String.format("LIMIT %d", limit))
                .replace("#%OFFSET%", String.format("OFFSET %d", offset));
        if (log.isTraceEnabled()) {
            log.trace("Entities Query: " + entitiesQueryStr);
        }
        TupleQuery query = conn.prepareTupleQuery(entitiesQueryStr);

        searchTextParam.ifPresent((searchText) -> query.setBinding(SEARCH_BINDING,
                conn.getValueFactory().createLiteral(searchText)));

        List<EntityMetadata> entities = new ArrayList<>();
        // Execute the query
        try (TupleQueryResult result = query.evaluate()) {
            result.forEach((BindingSet bindings) -> {
                entities.add(createEntityMetadata(bindings));
            });
            if (log.isTraceEnabled()) {
                log.trace("Entities Query Timings: " + query.explain(Explanation.Level.Timed).toString());
            }
        }
        // Create SimpleSearchResults
        int pageNumber = (limit > 0) ? (offset / limit) + 1 : 1;
        return new SimpleSearchResults<>(entities, totalCount, limit, pageNumber);
    }

    /**
     * Creates an {@link EntityMetadata} object based on the provided {@link BindingSet}.
     *
     * @param bindings The {@link BindingSet} containing the values for entity metadata.
     * @return An {@link EntityMetadata} object populated with the values extracted from the binding set.
     */
    private static EntityMetadata createEntityMetadata(BindingSet bindings) {
        String iri = Bindings.requiredResource(bindings, ENTITY_IRI_BINDING).stringValue();
        String entityName = getValueOrEmptyString(bindings, ENTITY_NAME_BINDING);
        final List<String> entityTypes;
        String entityTypeBinding = getValueOrEmptyString(bindings, ENTITY_TYPES_BINDING);
        if (StringUtils.isBlank(entityTypeBinding)) {
            entityTypes = List.of();
        } else {
            entityTypes =  Arrays.asList(entityTypeBinding.split(SEPARATOR_DELIMITER));
        }
        String description = getValueOrEmptyString(bindings, DESCRIPTION_BINDING);
        Map<String, String> metadataMap = Map.of(
                "iri", Bindings.requiredResource(bindings, RECORD_BINDING).stringValue(),
                "title", getValueOrEmptyString(bindings, "recordTitle"),
                "type", Bindings.requiredResource(bindings, RECORD_TYPE_BINDING).stringValue()
        );
        final List<String> recordKeywords;
        String keywordBindingString = getValueOrEmptyString(bindings, "keywords");
        if (StringUtils.isBlank(keywordBindingString)) {
            recordKeywords = List.of();
        } else {
            recordKeywords = Arrays.asList(keywordBindingString.split(SEPARATOR_DELIMITER));
        }
        List<String> predObjectPairs = Arrays.asList(getValueOrEmptyString(bindings, "predObjects")
                .split(PAIR_SEPARATOR_DELIMITER));
        List<Map<String, String>> matchingAnnotations = predObjectPairs.stream().map((String pair) -> {
            String[] pairSplit = pair.split(SEPARATOR_DELIMITER);
            Map<String, String> annotationMap = new LinkedHashMap<>();
            annotationMap.put("prop", pairSplit[0]);
            annotationMap.put("value", pairSplit[1]);
            return annotationMap;
        }).toList();
        return new EntityMetadata(iri, entityName, entityTypes, description, metadataMap,
                recordKeywords, matchingAnnotations);
    }

    private static String getValueOrEmptyString(BindingSet bindings, String bindingName) {
        return bindings.getValue(bindingName) != null ? bindings.getValue(bindingName).stringValue() : "";
    }

    @Override
    public PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams,
                                                     RepositoryConnection conn) {
        Optional<Resource> typeParam = searchParams.getTypeFilter();
        Optional<String> searchTextParam = searchParams.getSearchText();

        String queryStr = replaceRecordsFilter(new ArrayList<>(), COUNT_RECORDS_QUERY);
        // Get Total Count
        TupleQuery countQuery = conn.prepareTupleQuery(replaceCreatorFilter(searchParams,
                replaceKeywordFilter(searchParams, queryStr)));
        countQuery.setBinding(CATALOG_BINDING, catalogId);
        typeParam.ifPresent(resource -> countQuery.setBinding(TYPE_FILTER_BINDING, resource));
        searchTextParam.ifPresent(s -> countQuery.setBinding(SEARCH_BINDING, vf.createLiteral(s)));

        TupleQueryResult countResults = countQuery.evaluate();

        int totalCount;
        BindingSet countBindingSet;
        if (countResults.hasNext()
                && (countBindingSet = countResults.next()).getBindingNames().contains(RECORD_COUNT_BINDING)) {
            totalCount = Bindings.requiredLiteral(countBindingSet, RECORD_COUNT_BINDING).intValue();
            countResults.close();
        } else {
            countResults.close();
            conn.close();
            return SearchResults.emptyResults();
        }
        log.debug("Record count: " + totalCount);

        Function<String, String> queryFunc = querySuffix -> {
            String queryString = replaceRecordsFilter(new ArrayList<>(), replaceCreatorFilter(searchParams,
                    replaceKeywordFilter(searchParams, FIND_RECORDS_QUERY + querySuffix)));
            log.debug("Query String:\n" + queryString);
            return queryString;
        };

        return executeFindRecords(catalogId, searchParams, totalCount, queryFunc, conn);
    }

    @Override
    public PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams,
                                                     User user, RepositoryConnection conn) {
        List<String> viewableRecords = getViewableRecords(catalogId, searchParams, user, conn);
        int totalCount = viewableRecords.size();
        log.debug("Record count: " + totalCount);

        if (totalCount == 0) {
            return SearchResults.emptyResults();
        }

        Function<String, String> queryFunc = querySuffix -> {
            String queryString = replaceKeywordFilter(searchParams, FIND_RECORDS_QUERY + querySuffix);
            queryString = replaceCreatorFilter(searchParams, queryString);
            queryString = replaceRecordsFilter(viewableRecords, queryString);
            log.debug("Query String:\n" + queryString);
            return queryString;
        };

        return executeFindRecords(catalogId, searchParams, totalCount, queryFunc, conn);
    }

    @Override
    public PaginatedSearchResults<KeywordCount> getKeywords(Resource catalogId, PaginatedSearchParams searchParams,
                                                            RepositoryConnection conn) {
        int totalCount = getKeywordCount(conn, catalogId, searchParams);

        if (totalCount == 0) {
            return SearchResults.emptyResults();
        }

        log.debug("Keyword count: " + totalCount);

        // Prepare Query
        int offset = searchParams.getOffset();
        int limit = searchParams.getLimit().orElse(totalCount);
        if (offset > totalCount) {
            throw new IllegalArgumentException("Offset exceeds total size");
        }
        String queryString = GET_KEYWORD_QUERY + "\nLIMIT " + limit + "\nOFFSET " + offset;

        log.debug("Query String:\n" + queryString);

        TupleQuery query = conn.prepareTupleQuery(queryString);
        query.setBinding(CATALOG_BINDING, catalogId);
        searchParams.getSearchText().ifPresent(s -> query.setBinding(SEARCH_BINDING, vf.createLiteral(s)));

        log.debug("Query Plan:\n" + query);

        // Get Results
        TupleQueryResult result = query.evaluate();

        List<KeywordCount> keywordCounts = new ArrayList<>();
        result.forEach(bindings -> {
            keywordCounts.add(new KeywordCount(
                    vf.createLiteral(Bindings.requiredLiteral(bindings, KEYWORD_BINDING).stringValue()),
                    Bindings.requiredLiteral(bindings, RECORD_COUNT_BINDING).intValue()));
        });

        result.close();

        log.debug("Result set size: " + keywordCounts.size());

        int pageNumber = (limit > 0) ? (offset / limit) + 1 : 1;

        return !keywordCounts.isEmpty() ? new SimpleSearchResults<>(keywordCounts, totalCount, limit, pageNumber) :
                SearchResults.emptyResults();
    }

    @Override
    public <T extends Record> T getRecord(Resource catalogId, Resource recordId,
                                          OrmFactory<T> factory,
                                          RepositoryConnection conn) {
        validateRecord(catalogId, recordId, factory.getTypeIRI(), conn);
        return thingManager.getObject(recordId, factory, conn);
    }

    @Override
    public Set<Resource> getRecordIds(Resource catalogId, RepositoryConnection conn) {
        thingManager.validateResource(catalogId, vf.createIRI(Catalog.TYPE), conn);
        Set<Resource> results = new HashSet<>();
        conn.getStatements(null, vf.createIRI(Record.catalog_IRI), catalogId)
                .forEach(statement -> results.add(statement.getSubject()));
        return results;
    }

    @Override
    public <T extends Record> Optional<T> getRecordOpt(Resource catalogId, Resource recordId, OrmFactory<T> factory,
                                                       RepositoryConnection conn) {
        thingManager.validateResource(catalogId, catalogFactory.getTypeIRI(), conn);
        return thingManager.optObject(recordId, factory, conn).flatMap(record -> {
            Resource catalog = record.getCatalog_resource().orElseThrow(() ->
                    new IllegalStateException("Record " + recordId + " does not have a Catalog set"));
            return !catalog.equals(catalogId) ? Optional.empty() : Optional.of(record);
        });
    }

    @Override
    public RecordService<? extends Record> getRecordService(Resource recordId, RepositoryConnection conn) {
        OrmFactory<? extends Record> factory = getFactory(recordId, conn, false);
        return Optional.ofNullable(getRecordService(factory.getType()))
                .orElseThrow(() -> new IllegalArgumentException("Service for factory " + factory.getType().toString()
                        + " is unavailable or doesn't exist."));
    }

    @Override
    public <T extends Record> T removeRecord(Resource catalogId, Resource recordId, User user, Class<T> recordClass,
                                             RepositoryConnection conn) {
        validateRecord(catalogId, recordId, recordFactory.getTypeIRI(), conn);
        OrmFactory<? extends Record> serviceType = getFactory(recordId, conn, false);
        RecordService<T> service;
        if (recordClass.equals(Record.class)) {
            service = (RecordService<T>) getRecordService(serviceType.getType());
        } else {
            if (!serviceType.getType().equals(recordClass)) {
                throw new IllegalArgumentException("Service for factory " + recordClass
                        + " is unavailable or doesn't exist.");
            }
            service = getRecordService(recordClass);
        }
        return service.delete(recordId, user, conn);
    }

    @Override
    public <T extends Record> void updateRecord(Resource catalogId, T newRecord, RepositoryConnection conn) {
        validateRecord(catalogId, newRecord.getResource(), recordFactory.getTypeIRI(), conn);
        newRecord.setProperty(vf.createLiteral(OffsetDateTime.now()), vf.createIRI(_Thing.modified_IRI));
        thingManager.updateObject(newRecord, conn);
    }

    @Override
    public void validateRecord(Resource catalogId, Resource recordId, IRI recordType,
                               RepositoryConnection conn) {
        thingManager.validateResource(catalogId, vf.createIRI(Catalog.TYPE), conn);
        thingManager.validateResource(recordId, recordType, conn);
        if (!ConnectionUtils.contains(conn, recordId, vf.createIRI(Record.catalog_IRI), catalogId)) {
            throw thingManager.throwDoesNotBelong(recordId, recordFactory, catalogId, catalogFactory);
        }
    }

    protected List<String> getViewableRecords(Resource catalogId, PaginatedSearchParams searchParams, User user,
                                           RepositoryConnection conn) {
        Optional<Resource> typeParam = searchParams.getTypeFilter();

        String queryString = replaceRecordsFilter(new ArrayList<>(), replaceCreatorFilter(searchParams,
                replaceKeywordFilter(searchParams, FIND_RECORDS_QUERY)));

        log.debug("Query String:\n" + queryString);

        TupleQuery query = conn.prepareTupleQuery(queryString);
        query.setBinding(CATALOG_BINDING, catalogId);
        typeParam.ifPresent(resource -> query.setBinding(TYPE_FILTER_BINDING, resource));
        searchParams.getSearchText().ifPresent(searchText ->
                query.setBinding(SEARCH_BINDING, vf.createLiteral(searchText)));

        log.debug("Query Plan:\n" + query);

        // Get Results
        List<String> recordIRIs = new ArrayList<>();
        try (TupleQueryResult result = query.evaluate()) {
            result.forEach(bindings -> recordIRIs.add(Bindings.requiredResource(bindings, RECORD_BINDING)
                    .stringValue()));
        }

        Map<String, Literal> subjectAttrs = new HashMap<>();
        Map<String, Literal> actionAttrs = new HashMap<>();

        IRI subjectId = (IRI) user.getResource();

        // Will this always be Read?
        IRI actionId = vf.createIRI(Read.TYPE);

        List<IRI> resourceIds = recordIRIs.stream().map(vf::createIRI)
                .collect(Collectors.toList());
        subjectAttrs.put(XACML.SUBJECT_ID, vf.createLiteral(subjectId.stringValue()));
        actionAttrs.put(XACML.ACTION_ID, vf.createLiteral(actionId.stringValue()));

        if (resourceIds.isEmpty()) {
            return new ArrayList<>();
        }

        Request request = pdp.createRequest(List.of(subjectId), subjectAttrs, resourceIds, new HashMap<>(),
                List.of(actionId), actionAttrs);

        Set<String> viewableRecords = pdp.filter(request,
                vf.createIRI(POLICY_PERMIT_OVERRIDES));
        return new ArrayList<>(viewableRecords);
    }

    protected String escapeKeyword(String keyword) {
        return keyword.replace("\\", "\\\\").replace("'", "\\'");
    }

    protected void removeRecordService(RecordService<? extends Record> recordService) {
        recordServices.remove(recordService.getType());
    }

    protected String replaceCreatorFilter(PaginatedSearchParams searchParams, String queryString) {
        if (searchParams.getCreators().isPresent() && !searchParams.getCreators().get().isEmpty()) {
            StringBuilder creatorFilter = new StringBuilder();
            creatorFilter.append("?record dc:publisher ?creator .\n");
            creatorFilter.append("FILTER(?creator IN (");

            String creators = searchParams.getCreators().get().stream()
                    .map(iri -> "<" + iri + ">").collect(Collectors.joining(","));
            creatorFilter.append(creators).append("))");
            queryString = queryString.replace("%CREATORS_FILTER%", creatorFilter.toString());
        } else {
            queryString = queryString.replace("%CREATORS_FILTER%", "");
        }
        return queryString;
    }

    protected String replaceKeywordFilter(PaginatedSearchParams searchParams, String queryString) {
        if (searchParams.getKeywords().isPresent()) {
            StringBuilder keywordFilter = new StringBuilder();
            keywordFilter.append("?record mcat:keyword ?keyword .\n");
            keywordFilter.append("FILTER(?keyword IN (");

            List<String> tempKeywords = searchParams.getKeywords().get();

            for (int i = 0; i < tempKeywords.size(); i++) {
                keywordFilter.append(String.format("'%s'" ,escapeKeyword(tempKeywords.get(i))));

                if (i < tempKeywords.size() - 1) {
                    keywordFilter.append(",");
                }
            }
            keywordFilter.append("))");

            queryString = queryString.replace("%KEYWORDS_FILTER%", keywordFilter.toString());
        } else {
            queryString = queryString.replace("%KEYWORDS_FILTER%", "");
        }
        return queryString;
    }

    /**
     * Creates the base for the sorting options Object.
     */
    private void createSortingOptions() {
        sortingOptions.put(vf.createIRI(_Thing.modified_IRI), "modified");
        sortingOptions.put(vf.createIRI(_Thing.issued_IRI), "issued");
        sortingOptions.put(vf.createIRI(_Thing.title_IRI), "title");
    }

    private PaginatedSearchResults<Record> executeFindRecords(Resource catalogId,
                                                              PaginatedSearchParams searchParams,
                                                              int totalCount,
                                                              Function<String, String> queryFunc,
                                                              RepositoryConnection conn) {
        // Prepare Query
        int offset = searchParams.getOffset();
        int limit = searchParams.getLimit().orElse(totalCount);

        if (offset > totalCount) {
            throw new IllegalArgumentException("Offset exceeds total size");
        }

        StringBuilder querySuffix = new StringBuilder("\nORDER BY ");
        Resource sortByParam = searchParams.getSortBy().orElse(vf.createIRI(_Thing.modified_IRI));
        StringBuilder binding = new StringBuilder();
        if (sortByParam.equals(vf.createIRI(_Thing.title_IRI))) {
            binding.append("lcase(?").append(sortingOptions.getOrDefault(sortByParam, "modified")).append(")");
        } else {
            binding.append("?").append(sortingOptions.getOrDefault(sortByParam, "modified"));
        }
        Optional<Boolean> ascendingParam = searchParams.getAscending();
        if (ascendingParam.isPresent() && ascendingParam.get()) {
            querySuffix.append(binding);
        } else {
            querySuffix.append("DESC(").append(binding).append(")");
        }
        querySuffix.append("\nLIMIT ").append(limit).append("\nOFFSET ").append(offset);

        String queryString = queryFunc.apply(querySuffix.toString());

        TupleQuery query = conn.prepareTupleQuery(queryString);
        query.setBinding(CATALOG_BINDING, catalogId);

        Optional<Resource> typeParam = searchParams.getTypeFilter();
        Optional<String> searchTextParam = searchParams.getSearchText();

        typeParam.ifPresent(resource -> query.setBinding(TYPE_FILTER_BINDING, resource));
        searchTextParam.ifPresent(searchText -> query.setBinding(SEARCH_BINDING, vf.createLiteral(searchText)));

        log.debug("Query Plan:\n" + query);

        // Get Results
        TupleQueryResult result = query.evaluate();

        List<Record> records = new ArrayList<>();
        result.forEach(bindings -> {
            Resource resource = vf.createIRI(Bindings.requiredResource(bindings, RECORD_BINDING)
                    .stringValue());
            records.add(getRecord(catalogId, resource, recordFactory, conn));
        });

        result.close();

        log.debug("Result set size: " + records.size());

        int pageNumber = (limit > 0) ? (offset / limit) + 1 : 1;

        return !records.isEmpty() ? new SimpleSearchResults<>(records, totalCount, limit, pageNumber) :
                SearchResults.emptyResults();
    }

    /**
     * Takes a recordId and returns the factory for that record. If a factory for that particular record is not
     * registered, it returns the most specific factory available if the flag is set to false.
     *
     * @param recordId The record IRI
     * @param exactOnly A flag to indicate whether to do an exact match with the record type. If false, will allow
     *                  the closest match to be returned
     * @return the record factory of a given recordId
     */
    private OrmFactory<? extends Record> getFactory(Resource recordId, RepositoryConnection conn, boolean exactOnly) {
        List<Resource> types = QueryResults.asList(
                conn.getStatements(recordId, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null))
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();

        List<OrmFactory<? extends Record>> classType = factoryRegistry.getSortedFactoriesOfType(Record.class).stream()
                .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                .toList();

        if (exactOnly && classType.size() > 0) {
            if (recordServices.containsKey(classType.get(0).getType())) {
                return classType.get(0);
            }
        } else {
            for (OrmFactory<? extends Record> factory : classType) {
                if (recordServices.containsKey(factory.getType())) {
                    return factory;
                }
            }
        }
        throw new IllegalArgumentException("No known record services for this record type.");
    }

    private int getKeywordCount(RepositoryConnection conn, Resource catalogId, PaginatedSearchParams searchParams) {
        TupleQuery countQuery = conn.prepareTupleQuery(GET_KEYWORD_COUNT_QUERY);
        countQuery.setBinding(CATALOG_BINDING, catalogId);
        searchParams.getSearchText().ifPresent(searchText ->
                countQuery.setBinding(SEARCH_BINDING, vf.createLiteral(searchText)));

        TupleQueryResult countResults = countQuery.evaluate();
        int totalCount = 0;
        if (countResults.getBindingNames().contains(KEYWORD_COUNT_BINDING) && countResults.hasNext()) {
            totalCount = Bindings.requiredLiteral(countResults.next(), KEYWORD_COUNT_BINDING).intValue();
        }
        countResults.close();
        return totalCount;
    }

    private <T extends Record> RecordService<T> getRecordService(Class<T> clazz) {
        return recordServices.get(clazz);
    }

    private String replaceRecordsFilter(List<String> recordIRIs, String queryString) {
        if (!recordIRIs.isEmpty()) {
            StringBuilder recordsFilter = new StringBuilder();
            recordsFilter.append("FILTER(?record IN (");

            for (int i = 0; i < recordIRIs.size(); i++) {
                recordsFilter.append("<");
                recordsFilter.append(recordIRIs.get(i));
                recordsFilter.append(">");

                if (i < recordIRIs.size() - 1) {
                    recordsFilter.append(",");
                }
            }
            recordsFilter.append("))");

            queryString = queryString.replace("%RECORDS_FILTER%", recordsFilter.toString());
        } else {
            queryString = queryString.replace("%RECORDS_FILTER%", "");
        }
        return queryString;
    }
}
