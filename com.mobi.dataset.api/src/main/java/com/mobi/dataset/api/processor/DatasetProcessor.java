package com.mobi.dataset.api.processor;

/*-
 * #%L
 * com.mobi.persistence.api
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

import com.mobi.query.api.processor.OperationProcessor;

/**
 * An OperationProcessor that processes operations against datasets. The processor will rewrite SPARQL operations such
 * that they will correctly limit queries and updates to the dataset specified as part of the operation.
 *
 * Dataset processing occurs in line with the SPARQL 1.1 Spec. That is, if a query provides a dataset description,
 * then it is used in place of any dataset that the Operation would use if no dataset description is provided in a
 * query. The dataset description may also be specified by the RepositoryConnection, in which case the connection
 * description overrides any description in the query itself. A Repository service may refuse a query request if the
 * dataset description is not acceptable to the service.
 */
public interface DatasetProcessor extends OperationProcessor {

    /**
     * Processes an operation to ensure that query and update results are limited to graphs within a Mobi Dataset.
     */
    void process();
}
