package org.matonto.query.api.processor;

/**
 * An OperationProcessor that processes queries against datasets. The processor will rewrite SPARQL queries such that
 * they will correctly limit results and updates to datasets specified as part of the operation.
 *
 * Dataset processing occurs in line with the SPARQL 1.1 Spec. That is, if a query provides a dataset description,
 * then it is used in place of any dataset that the Operation would use if no dataset description is provided in a
 * query. The dataset description may also be specified by the RepositoryConnection, in which case the connection
 * description overrides any description in the query itself. A Repository service may refuse a query request if the
 * dataset description is not acceptable to the service.
 */
public interface DatasetProcessor extends OperationProcessor {
}
