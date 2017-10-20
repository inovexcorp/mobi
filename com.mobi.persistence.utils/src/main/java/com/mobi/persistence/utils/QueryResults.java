package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Statement;
import com.mobi.query.api.QueryResult;
import com.mobi.rdf.api.ModelFactory;

import java.util.ArrayList;
import java.util.List;

public class QueryResults {

    /**
     * Returns the Model containing all the Statements from a QueryResult.
     *
     * @param results - The QueryResult containing Statements for the Model
     * @param factory - The ModelFactory from which to create an empty Model
     * @return the Model containing all the Statements from a QueryResult.
     */
    public static Model asModel(QueryResult<Statement> results, ModelFactory factory) {
        Model model = factory.createModel();
        results.forEach(model::add);
        return model;
    }

    /**
     * Returns the List containing all the Objects from a QueryResult.
     *
     * @param results - The QueryResult containing the Objects for the List
     * @param <T> - The type of Objects contained in the QueryResult
     * @return the List containing all the Objects from a QueryResult.
     */
    public static <T> List<T> asList(QueryResult<T> results) {
        List<T> list = new ArrayList<>();
        results.forEach(list::add);
        return list;
    }
}
